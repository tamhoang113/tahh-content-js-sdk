param(
    [string]$UpstreamRemote = 'upstream',
    [string]$UpstreamUrl = 'https://github.com/episerver/content-js-sdk.git',
    [string]$UpstreamBranch = 'main',
    [string]$TargetBranch = 'main',
    [string]$LockfilePath = 'pnpm-lock.yaml',
    [string[]]$PreserveOursPaths = @('.github/workflows/vercel-prod.yaml'),
    [string[]]$RequiredPaths = @('_qa/helpers/sdk-api.ts', 'samples/nextjs-template/src/qa/_registry.ts'),
    [switch]$RegenerateLockfile = $true,
    [switch]$Push
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

function Invoke-Git {
    param(
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )

    $output = & git @Args 2>&1
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
        if ($output) {
            $output | Write-Host
        }
        throw "git $($Args -join ' ') failed with exit code $exitCode"
    }

    return $output
}

function Test-GitPathExistsInHead {
    param([string]$Path)

    & git cat-file -e "HEAD:$Path" 2>$null
    return ($LASTEXITCODE -eq 0)
}

function Get-UnmergedPaths {
    $paths = & git diff --name-only --diff-filter=U
    if ($LASTEXITCODE -ne 0) {
        throw 'Unable to list unmerged files'
    }

    return @($paths | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

function Resolve-KnownConflicts {
    param([string[]]$ConflictedPaths)

    $unsupported = @()
    foreach ($path in $ConflictedPaths) {
        if ($path -eq $LockfilePath) {
            continue
        }
        if ($PreserveOursPaths -contains $path) {
            continue
        }
        $unsupported += $path
    }

    if ($unsupported.Count -gt 0) {
        Write-Host 'Unsupported conflicts detected:' -ForegroundColor Red
        $unsupported | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
        throw 'Manual conflict resolution required'
    }

    foreach ($path in $ConflictedPaths) {
        if ($path -eq $LockfilePath) {
            Write-Host "Taking current branch version of $LockfilePath before regeneration"
            Invoke-Git checkout --ours -- $LockfilePath | Out-Null
            Invoke-Git add -- $LockfilePath | Out-Null
            continue
        }

        if ($PreserveOursPaths -contains $path) {
            if (Test-GitPathExistsInHead -Path $path) {
                Write-Host "Preserving current branch version of $path"
                Invoke-Git checkout --ours -- $path | Out-Null
                Invoke-Git add -- $path | Out-Null
            }
            else {
                Write-Host "Preserving deletion of $path"
                Invoke-Git rm -- $path | Out-Null
            }
        }
    }

    $remaining = Get-UnmergedPaths
    if ($remaining.Count -gt 0) {
        Write-Host 'Conflicts still remain after auto-resolution:' -ForegroundColor Red
        $remaining | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
        throw 'Auto-resolution incomplete'
    }
}

function Assert-RequiredPaths {
    foreach ($path in $RequiredPaths) {
        if (-not (Test-Path -LiteralPath $path)) {
            throw "Required fork-only path missing after merge: $path"
        }
    }
}

$currentBranch = (& git branch --show-current).Trim()
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to determine current branch'
}
if ($currentBranch -ne $TargetBranch) {
    throw "Current branch is '$currentBranch'. Switch to '$TargetBranch' before running this script."
}

$dirty = & git status --porcelain
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to inspect working tree state'
}
if ($dirty) {
    throw 'Working tree is dirty. Commit or stash changes before running sync-upstream.ps1.'
}

$remoteNames = @((& git remote) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($remoteNames -notcontains $UpstreamRemote) {
    Invoke-Git remote add $UpstreamRemote $UpstreamUrl | Out-Null
}
else {
    Invoke-Git remote set-url $UpstreamRemote $UpstreamUrl | Out-Null
}

$gitUserName = (& git config user.name).Trim()
if (-not $gitUserName) {
    Invoke-Git config user.name 'github-actions[bot]' | Out-Null
}
$gitUserEmail = (& git config user.email).Trim()
if (-not $gitUserEmail) {
    Invoke-Git config user.email 'github-actions[bot]@users.noreply.github.com' | Out-Null
}

Write-Host "Fetching $UpstreamRemote/$UpstreamBranch"
Invoke-Git fetch $UpstreamRemote $UpstreamBranch --prune | Out-Null

$behindAhead = (& git rev-list --left-right --count "$UpstreamRemote/$UpstreamBranch...HEAD").Trim().Split([char]' ', [System.StringSplitOptions]::RemoveEmptyEntries)
if ($behindAhead.Count -lt 2) {
    throw 'Unable to determine ahead/behind counts'
}
$behind = [int]$behindAhead[0]
$ahead = [int]$behindAhead[1]
Write-Host "Ahead: $ahead | Behind: $behind"

if ($behind -eq 0) {
    Write-Host 'Already up to date with upstream. Nothing to merge.'
    if ($Push) {
        Write-Host 'Push requested, but there are no new sync commits to publish.'
    }
    exit 0
}

$mergeStarted = $false
try {
    & git merge --no-ff --no-commit "$UpstreamRemote/$UpstreamBranch"
    $mergeExit = $LASTEXITCODE
    if ($mergeExit -ne 0) {
        $mergeStarted = Test-Path '.git\MERGE_HEAD'
        if (-not $mergeStarted) {
            throw "git merge returned exit code $mergeExit before creating a merge state"
        }

        $conflictedPaths = Get-UnmergedPaths
        if ($conflictedPaths.Count -eq 0) {
            throw 'Merge failed but no conflicted files were reported'
        }

        Write-Host 'Attempting auto-resolution for known conflicts:'
        $conflictedPaths | ForEach-Object { Write-Host " - $_" }
        Resolve-KnownConflicts -ConflictedPaths $conflictedPaths
    }
    else {
        $mergeStarted = Test-Path '.git\MERGE_HEAD'
        Write-Host 'Merge applied cleanly and is pending commit.'
    }

    Assert-RequiredPaths

    if ($RegenerateLockfile) {
        Write-Host 'Regenerating pnpm lockfile'
        & pnpm install --lockfile-only
        if ($LASTEXITCODE -ne 0) {
            throw 'pnpm install --lockfile-only failed'
        }
        Invoke-Git add -- $LockfilePath | Out-Null
    }

    if ($mergeStarted) {
        Invoke-Git add -A | Out-Null
        & git diff --cached --quiet
        if ($LASTEXITCODE -eq 0) {
            throw 'Merge produced no staged changes to commit'
        }
        Invoke-Git commit -m "Merge $UpstreamRemote/$UpstreamBranch into $TargetBranch" | Out-Null
        Write-Host 'Merge commit created successfully.' -ForegroundColor Green
    }

    if ($Push) {
        Write-Host 'Pushing synced branch to origin'
        Invoke-Git push origin $TargetBranch | Out-Null
    }
}
catch {
    if (Test-Path '.git\MERGE_HEAD') {
        Write-Host 'Aborting incomplete merge' -ForegroundColor Yellow
        & git merge --abort | Out-Null
    }
    throw
}

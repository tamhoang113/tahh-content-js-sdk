@echo off
echo ========================================
echo Optimizely CMS SDK Clean & Rebuild Script
echo ========================================

echo.
echo Step 1: Clearing build directories...

REM Clear Next.js template .next directory
if exist "samples\nextjs-template\.next" (
    echo Removing samples\nextjs-template\.next...
    rmdir /s /q "samples\nextjs-template\.next"
    echo samples\nextjs-template\.next cleared
) else (
    echo samples\nextjs-template\.next does not exist
)

REM Clear Stride template .next directory
if exist "templates\stride\.next" (
    echo Removing templates\stride\.next...
    rmdir /s /q "templates\stride\.next"
    echo templates\stride\.next cleared
) else (
    echo templates\stride\.next does not exist
)

REM Clear optimizely-cms-sdk dist directory
if exist "packages\optimizely-cms-sdk\dist" (
    echo Removing packages\optimizely-cms-sdk\dist...
    rmdir /s /q "packages\optimizely-cms-sdk\dist"
    echo packages\optimizely-cms-sdk\dist cleared
) else (
    echo packages\optimizely-cms-sdk\dist does not exist
)

REM Clear optimizely-cms-cli dist directory
if exist "packages\optimizely-cms-cli\dist" (
    echo Removing packages\optimizely-cms-cli\dist...
    rmdir /s /q "packages\optimizely-cms-cli\dist"
    echo packages\optimizely-cms-cli\dist cleared
) else (
    echo packages\optimizely-cms-cli\dist does not exist
)

echo.
echo Step 2: Installing dependencies...
echo Installing root dependencies...
call pnpm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Building optimizely-cms-sdk...
cd packages\optimizely-cms-sdk
call pnpm install
if errorlevel 1 (
    echo ERROR: Failed to install optimizely-cms-sdk dependencies
    pause
    exit /b 1
)
call pnpm build
if errorlevel 1 (
    echo ERROR: Failed to build optimizely-cms-sdk
    pause
    exit /b 1
)
echo optimizely-cms-sdk built successfully!

echo.
echo Step 4: Building optimizely-cms-cli...
cd ..\optimizely-cms-cli
call pnpm install
if errorlevel 1 (
    echo ERROR: Failed to install optimizely-cms-cli dependencies
    pause
    exit /b 1
)
call pnpm build
if errorlevel 1 (
    echo ERROR: Failed to build optimizely-cms-cli
    pause
    exit /b 1
)
echo optimizely-cms-cli built successfully!

echo.
echo Step 5: Building nextjs-template...
cd ..\..\samples\nextjs-template
call pnpm install
if errorlevel 1 (
    echo ERROR: Failed to install nextjs-template dependencies
    pause
    exit /b 1
)
call pnpm build
if errorlevel 1 (
    echo ERROR: Failed to build nextjs-template
    pause
    exit /b 1
)
echo nextjs-template built successfully!

echo.
echo Step 6: Building stride-template...
cd ..\..\templates\stride
call pnpm install
if errorlevel 1 (
    echo ERROR: Failed to install stride dependencies
    pause
    exit /b 1
)
call pnpm build
if errorlevel 1 (
    echo ERROR: Failed to build stride
    pause
    exit /b 1
)
echo stride built successfully!

echo.
echo ========================================
echo All projects built successfully!
echo ========================================
pause


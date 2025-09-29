# Frontend Deployment Guide

## Quick Reference for Render Deployment

### Build Configuration
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

## Understanding the Build Process

### Why These Commands?

#### Build Command: `npm run build`
- **What it does:** Executes the `vite build` command defined in `package.json`
- **Purpose:** Compiles, optimizes, and bundles your React application for production
- **Output:** Creates optimized static files in the `dist` directory

#### Publish Directory: `dist`
- **What it is:** The folder containing the built/compiled application
- **Why `dist`:** Vite's default output directory for production builds
- **Contents:** HTML, CSS, JavaScript, and asset files ready for deployment

## How to Research Build Configuration

### 1. Check package.json
```bash
# Look for build scripts
cat package.json | grep -A 5 "scripts"
```
**What to look for:**
- `build` script command
- Development vs production scripts

### 2. Check Build Tool Configuration
```bash
# For Vite projects
cat vite.config.js

# For Webpack projects
cat webpack.config.js

# For Create React App
# No config file needed, uses default
```

### 3. Test Build Locally
```bash
# Run the build command
npm run build

# Check what directory was created
ls -la
# Look for: dist, build, public, or out directories
```

### 4. Check Framework Documentation
- **Vite:** Default output is `dist`
- **Create React App:** Default output is `build`
- **Next.js:** Default output is `out` (for static export)
- **Angular:** Default output is `dist`

## Common Build Commands by Framework

| Framework | Build Command | Output Directory |
|-----------|---------------|------------------|
| Vite | `npm run build` | `dist` |
| Create React App | `npm run build` | `build` |
| Next.js | `npm run build` | `.next` |
| Next.js (static) | `npm run build && npm run export` | `out` |
| Angular | `ng build` | `dist` |
| Vue CLI | `npm run build` | `dist` |

## Troubleshooting

### Build Fails
1. Check dependencies: `npm install`
2. Check for TypeScript errors: `npm run typecheck` (if available)
3. Check for linting errors: `npm run lint`

### Wrong Output Directory
1. Check build tool config file
2. Look for `outDir`, `outputPath`, or `dist` settings
3. Run build locally and see what directory is created

### Build Works Locally But Fails on Render
1. Check Node.js version compatibility
2. Ensure all dependencies are in `dependencies` not `devDependencies`
3. Check environment variables are properly configured

## Environment Variables

For production deployment, ensure environment variables are set in Render:
- Check `.env.example` or similar files
- Look for `VITE_` prefixed variables (for Vite)
- Look for `REACT_APP_` prefixed variables (for CRA)
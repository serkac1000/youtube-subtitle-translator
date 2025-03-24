#!/bin/bash

# Set up git configuration
echo "Setting up git configuration..."
git config --global user.name "GitHub Action Bot"
git config --global user.email "action@github.com"

# Create a new branch for our fixes
BRANCH_NAME="speech-recognition-fixes"
echo "Creating new branch: $BRANCH_NAME"
git checkout -b $BRANCH_NAME

# Create necessary directories if they don't exist
echo "Creating necessary directories..."
mkdir -p client/src/components/debug

# Copy our enhanced speech recognition service
echo "Copying enhanced speech recognition service..."
cp -f speech_recognition_fixes/client/src/lib/speechRecognition.ts client/src/lib/
cp -f speech_recognition_fixes/client/src/components/debug/DebugLogger.ts client/src/components/debug/
cp -f speech_recognition_fixes/client/src/components/debug/DebugConsole.tsx client/src/components/debug/
cp -f speech_recognition_fixes/client/src/components/VideoPlayer.tsx client/src/components/

# Add README and integration guide
echo "Adding documentation..."
cp -f speech_recognition_fixes/README.md .
cp -f integration_guide.md .

# Add all files to git
echo "Adding files to git..."
git add client/src/lib/speechRecognition.ts
git add client/src/components/debug/
git add client/src/components/VideoPlayer.tsx
git add README.md
git add integration_guide.md

# Commit changes
echo "Committing changes..."
git commit -m "Add speech recognition fixes with enhanced error handling and debug tools"

# Push to GitHub
echo "Pushing to GitHub..."
git push -u origin $BRANCH_NAME

echo "Done! Your changes have been pushed to the '$BRANCH_NAME' branch."
echo "You can now create a pull request on GitHub to merge these changes into the main branch."
#!/bin/bash

# Ask for GitHub repository URL
echo "Enter your GitHub repository URL (e.g., https://github.com/username/repo.git):"
read REPO_URL

# Clone the repository
echo "Cloning repository..."
git clone $REPO_URL github_repo

# Change to repository directory
cd github_repo

# Create necessary directories
mkdir -p client/src/components/debug client/src/lib

# Copy our files to the repository
echo "Copying speech recognition fixes..."
cp -f ../speech_recognition_fixes/client/src/lib/speechRecognition.ts client/src/lib/
cp -f ../speech_recognition_fixes/client/src/components/debug/DebugLogger.ts client/src/components/debug/
cp -f ../speech_recognition_fixes/client/src/components/debug/DebugConsole.tsx client/src/components/debug/
cp -f ../speech_recognition_fixes/client/src/components/VideoPlayer.tsx client/src/components/

# Copy documentation
cp -f ../integration_guide.md .

# Set up git configuration
git config --global user.name "GitHub Action Bot"
git config --global user.email "action@github.com"

# Create a new branch
BRANCH_NAME="speech-recognition-fixes"
git checkout -b $BRANCH_NAME

# Add files to git
git add client/src/lib/speechRecognition.ts
git add client/src/components/debug/
git add client/src/components/VideoPlayer.tsx
git add integration_guide.md

# Commit changes
git commit -m "Add speech recognition fixes with enhanced error handling and debug tools"

# Push to GitHub using token
echo "Pushing to GitHub..."
GITHUB_TOKEN=$(printenv GITHUB_TOKEN)
REPO_WITH_TOKEN=$(echo $REPO_URL | sed -e "s/https:\/\//https:\/\/$GITHUB_TOKEN@/")
git push -u $REPO_WITH_TOKEN $BRANCH_NAME

echo "Done! Your changes have been pushed to the '$BRANCH_NAME' branch."
echo "You can now create a pull request on GitHub to merge these changes into the main branch."
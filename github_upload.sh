#!/bin/bash

# Replace this with your GitHub repository URL
REPO_URL="https://github.com/serkac1000/youtube-subtitle-translator.git"
BRANCH_NAME="speech-recognition-fixes"

# Create a temporary directory for the GitHub repository
mkdir -p github_temp
cd github_temp

# Initialize git
git init

# Set up git configuration
git config --global user.name "GitHub Action Bot"
git config --global user.email "action@github.com"

# Create the directory structure
mkdir -p client/src/lib client/src/components/debug

# Copy the speech recognition fixes
cp -f ../speech_recognition_fixes/client/src/lib/speechRecognition.ts client/src/lib/
cp -f ../speech_recognition_fixes/client/src/components/debug/DebugLogger.ts client/src/components/debug/
cp -f ../speech_recognition_fixes/client/src/components/debug/DebugConsole.tsx client/src/components/debug/
cp -f ../speech_recognition_fixes/client/src/components/VideoPlayer.tsx client/src/components/

# Copy documentation
cp -f ../integration_guide.md .
cp -f ../speech_recognition_fixes/README.md README.md

# Create a README if it doesn't exist
if [ ! -f README.md ]; then
  echo "# Speech Recognition Fixes for YouTube Subtitle Translator" > README.md
  echo "" >> README.md
  echo "This repository contains fixes for speech recognition issues in the YouTube Subtitle Translator application." >> README.md
  echo "" >> README.md
  echo "See integration_guide.md for instructions on how to integrate these fixes into your project." >> README.md
fi

# Add all files to git
git add .

# Commit changes
git commit -m "Add speech recognition fixes with enhanced error handling and debug tools"

# Add the remote GitHub repository with token authentication
GITHUB_TOKEN=$(printenv GITHUB_TOKEN)
REPO_WITH_TOKEN=$(echo $REPO_URL | sed -e "s/https:\/\//https:\/\/$GITHUB_TOKEN@/")
git remote add origin $REPO_WITH_TOKEN

# Fetch to make sure we have all branches
git fetch

# Create and checkout to a new branch
git checkout -b $BRANCH_NAME

# Push to GitHub
git push -u origin $BRANCH_NAME

# Return to original directory
cd ..

echo "Done! Your speech recognition fixes have been pushed to the '$BRANCH_NAME' branch."
echo "You can now create a pull request on GitHub to merge these changes into the main branch."
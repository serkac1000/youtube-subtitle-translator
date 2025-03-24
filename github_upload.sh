#!/bin/bash

# Set repository details
GITHUB_USERNAME="serkac1000"
REPO_NAME="Rutube_android"
REPO_URL="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# Create a new repository on GitHub using the API
curl -u "${GITHUB_USERNAME}:${GITHUB_TOKEN}" https://api.github.com/user/repos -d "{\"name\":\"${REPO_NAME}\",\"private\":false}"

# Initialize git and push android project
cd android
git init
git add .
git commit -m "Initial Android project setup"
git branch -M main
git remote add origin ${REPO_URL}
git push -u origin main

echo "Successfully uploaded Android project to ${REPO_URL}"
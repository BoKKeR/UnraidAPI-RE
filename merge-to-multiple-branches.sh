#!/bin/bash

# Store the current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Branches to merge into
BRANCHES=("7" "7.0" "6.12" "master")

# Loop through the branches and merge the current branch into each one
for BRANCH in "${BRANCHES[@]}"; do
    echo "Switching to branch $BRANCH"
    git checkout $BRANCH

    if [ $? -ne 0 ]; then
        echo "Error: Failed to switch to branch $BRANCH. Exiting."
        exit 1
    fi

    echo "Merging $CURRENT_BRANCH into $BRANCH"
    git merge $CURRENT_BRANCH

    if [ $? -ne 0 ]; then
        echo "Error: Merge failed for branch $BRANCH. Please resolve conflicts."
        exit 1
    fi

    echo "Pushing changes to remote for branch $BRANCH"
    git push origin $BRANCH

    if [ $? -ne 0 ]; then
        echo "Error: Failed to push to branch $BRANCH. Please check your connection or authentication."
        exit 1
    fi
done

# Switch back to the original branch
echo "Switching back to $CURRENT_BRANCH"
git checkout $CURRENT_BRANCH

echo "Merge completed."

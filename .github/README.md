# GitHub Workflows

This directory contains automated GitHub Actions workflows for the repository.

## Available Workflows

### 📧 Send Review Request Notifications

**File:** `review-requests-email.yml`

Automatically sends notifications about pending pull request reviews.

**Triggers:**
- When a PR is opened
- When a reviewer is requested on a PR
- When a PR is synchronized (updated)
- Daily at 9 AM UTC
- Manual trigger via Actions tab

**What it does:**
1. Scans all open PRs for pending reviews
2. Creates/updates a summary issue with all pending reviews
3. Lists PRs in chronological order (oldest first)
4. Includes review instructions for each PR
5. Sends GitHub email notifications to watchers

**How to use:**
- Automated - runs on its own
- Check for the "📧 Pending Review Requests Summary" issue
- Enable GitHub email notifications to receive updates
- See `docs/REVIEW_NOTIFICATION_SYSTEM.md` for complete details

**Manual trigger:**
1. Go to the Actions tab
2. Select "Send Review Request Notifications"
3. Click "Run workflow"

## Adding More Workflows

To add new workflows:

1. Create a new `.yml` file in this directory
2. Define the workflow triggers and jobs
3. Commit and push
4. The workflow will be available in the Actions tab

## Documentation

For detailed information about the notification system:
- System overview: `/docs/REVIEW_NOTIFICATION_SYSTEM.md`
- Current status: `/docs/CURRENT_REVIEW_REQUESTS.md`

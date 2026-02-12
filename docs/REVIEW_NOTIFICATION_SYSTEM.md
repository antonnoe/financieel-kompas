# Review Request Notification System

## Overview

This repository has an automated system that sends review request notifications to help manage pull request reviews efficiently.

## How It Works

### Automatic Notifications

The system runs automatically in these scenarios:

1. **When a PR is opened** - Immediately creates a summary of all pending reviews
2. **When a reviewer is requested** - Notifies the team about the new review request
3. **When a PR is updated** - Refreshes the review summary
4. **Daily at 9 AM UTC** - Sends a daily digest of all pending reviews

### Email Notifications

GitHub automatically sends email notifications for:
- Review requests on PRs where you're a requested reviewer
- Comments on PRs you're involved in
- Updates to the automated summary issue

### Enabling Email Notifications

To receive these emails, configure your GitHub notification settings:

1. Go to https://github.com/settings/notifications
2. Under "Participating, @mentions and custom", ensure **Email** is checked
3. Under "Watching", ensure **Email** is checked
4. Verify your email address at https://github.com/settings/emails

## The Review Summary Issue

The automation creates a special issue titled **"📧 Pending Review Requests Summary"** that contains:

- List of all PRs awaiting review
- PRs listed in chronological order (oldest first)
- Instructions for each PR
- Links to review each PR
- Status indicators (draft vs ready)

This issue is automatically:
- Created when there are pending reviews
- Updated whenever PR states change
- Tagged with `review-summary` and `automated` labels

## Review Instructions

When you receive a notification:

1. **Check the order** - Reviews are listed oldest-first to maintain project flow
2. **Visit each PR link** - Click the provided URL to see the changes
3. **Review the code** - Examine the changes, tests, and documentation
4. **Take action**:
   - ✅ **Approve** if changes look good
   - 💬 **Comment** if you have questions
   - ⚠️ **Request changes** if improvements are needed
5. **Merge when ready** - Once approved, merge the PR

## Priority Order

PRs are sorted by creation date (oldest first) to ensure:
- Important foundational changes are reviewed first
- Dependencies between PRs are respected
- Project momentum is maintained

## Manual Triggers

You can manually trigger the review summary by:

1. Go to the Actions tab
2. Select "Send Review Request Notifications"
3. Click "Run workflow"

## Customization

To modify the notification schedule:

1. Edit `.github/workflows/review-requests-email.yml`
2. Change the cron schedule in the `on.schedule` section
3. Commit and push your changes

Example: For every 6 hours instead of daily:
```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
```

## For Repository Maintainers

### Disabling Notifications

To disable the automated system:

1. Go to Actions tab
2. Find "Send Review Request Notifications"
3. Click the "..." menu
4. Select "Disable workflow"

### Viewing Workflow Runs

To see the workflow execution history:

1. Go to the Actions tab
2. Click "Send Review Request Notifications"
3. View past runs and their logs

## Troubleshooting

### Not Receiving Emails

1. Check your GitHub notification settings
2. Verify your email address is confirmed
3. Check your spam folder
4. Ensure you're watching the repository

### Summary Issue Not Created

1. Check the Actions tab for workflow errors
2. Verify the workflow has the necessary permissions
3. Check if there are actually pending reviews

### Old PRs Not Showing

1. The system only tracks open, non-draft PRs without approvals
2. Draft PRs are shown but marked as such
3. Already-approved PRs are excluded from the summary

## FAQ

**Q: Can I change the notification frequency?**  
A: Yes, edit the cron schedule in the workflow file.

**Q: Will I get spammed with notifications?**  
A: No, the system only updates the summary issue and sends notifications when PR states change.

**Q: Can I opt out?**  
A: Yes, adjust your GitHub notification settings or unwatch the repository.

**Q: What happens if I ignore a review request?**  
A: It will continue to appear in the daily summary until the PR is reviewed or closed.

**Q: Do draft PRs get notifications?**  
A: Draft PRs are included in the summary but clearly marked to indicate they're not ready for final review.

## Support

For issues with the notification system:
1. Check the Actions tab for workflow errors
2. Review the workflow logs
3. Open an issue if you find a bug

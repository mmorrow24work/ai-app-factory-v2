// Reference list of `gh`/script commands the Lane B pipeline actually runs. Every entry below
// is sourced from a file that exists in this repo today — see each entry's `source` field.
// See docs/adr/0001-design-to-issues-loop.md for the full loop these commands walk through.
export const CLI_STAGES = [
	{
		stage: 'Triggering a run',
		commands: [
			{
				command: 'gh issue edit <n> --add-label claude-go -R <owner>/<repo>',
				who: 'Human',
				when: 'Hands an issue to Lane B — matches the `issues: labeled` trigger in claude.yml.',
				source: '.github/workflows/claude.yml'
			},
			{
				command: '@claude <comment>  (posted on an issue or PR)',
				who: 'Human — a repo collaborator on this repo itself, or (in a generated project) the project’s own recorded requester, parsed from README.md’s "Requested by" line rather than being limited to OWNER/MEMBER/COLLABORATOR',
				when: 'A comment containing "@claude" re-fires the workflow via its issue_comment trigger. The comment’s own text is fetched via `gh api .../issues/comments/<id> --jq .body` and read into the prompt, not just used as a re-trigger signal (DESIGN.md’s "Lessons carried forward" records this as a bug found in the predecessor’s own root claude.yml) — this is how a requester gives feedback or redirects work mid-build, not just approve/reject on something already drafted.',
				source: '.github/workflows/claude.yml'
			},
			{
				command: 'gh workflow run claude.yml -f issue_number=<n> -R <owner>/<repo>',
				who: 'Human',
				when: 'Manual workflow_dispatch run; overrides the lane:interactive / lane:manual exclusions.',
				source: '.github/workflows/claude.yml'
			}
		]
	},
	{
		stage: 'Monitoring runs',
		commands: [
			{
				command: 'gh run list -R <owner>/<repo>',
				who: 'Human',
				when: 'Lists recent claude.yml runs and their status.',
				source: 'operational use — not embedded in a script'
			},
			{
				command: 'gh run view <run-id> -R <owner>/<repo>',
				who: 'Human',
				when: 'Inspects the logs/output of one run in detail.',
				source: 'operational use — not embedded in a script'
			},
			{
				command: 'gh issue view <n> --repo <owner>/<repo> --json title,body,labels,milestone',
				who: 'Workflow (claude.yml)',
				when: "Reads the target issue's labels (to resolve model + lane exclusions) and injects its title/body into Claude's prompt — a workflow_dispatch run has no event payload to fall back on.",
				source: '.github/workflows/claude.yml'
			},
			{
				command: 'gh pr list --repo <owner>/<repo> --search "linked:issue-<n>"',
				who: 'Workflow (journal-entry.sh)',
				when: 'Resolves the PR that references this issue, to record in the journal entry.',
				source: '.github/scripts/journal-entry.sh'
			}
		]
	},
	{
		stage: 'Ask → design doc',
		commands: [
			{
				command:
					'gh issue create --repo mmorrow24work/ai-app-factory-v2 --title "[new-project-ask] <name>" --body "<ask>"',
				who: 'Human, via the `/new` page (a pre-filled link to this exact GitHub issue form — no token, no account setup on the site itself)',
				when: 'draft-design-doc.yml triggers on issues: opened, filtered to the [new-project-ask] title prefix rather than a label — GitHub silently drops labels= on this URL for anyone who isn’t already a repo collaborator with label-write access, which is exactly the non-collaborator requester this flow serves. Opus drafts docs/proposals/<slug>.md and opens a "Design: <name>" PR against main for review; a script step (never the LLM step) stamps the issue author’s authenticated GitHub login onto the doc and PR as the requester identity.',
				source: '.github/workflows/draft-design-doc.yml'
			}
		]
	},
	{
		stage: 'Review → provisioning plan',
		commands: [
			{
				command: 'gh pr merge <n> --repo mmorrow24work/ai-app-factory-v2',
				who: 'Human — approval gate #1',
				when: "Reviews/edits the drafted design doc in GitHub's normal PR review UI, then merges it. The merge (a push to main touching docs/proposals/*.md) is what fires generate-issues.yml next.",
				source: 'GitHub PR review UI — no script'
			},
			{
				command:
					'gh workflow run generate-issues.yml -R mmorrow24work/ai-app-factory-v2 -f doc_path=docs/proposals/<slug>.md',
				who: 'Workflow (generate-issues.yml) — auto-fired on merge via a push-triggered dispatch job; this is the manual re-run form',
				when: 'Reads the merged design doc and opens a "Provision <owner>/<slug>" issue in ai-app-factory-v2 itself with the exact commands to run next. Creates nothing else and never touches another repo — provisioning the new repo stays a human step with the human’s own gh auth.',
				source: '.github/workflows/generate-issues.yml'
			}
		]
	},
	{
		stage: 'Provision the repo',
		commands: [
			{
				command:
					'scripts/factory-new.sh <type> <repo-name> --ask "<summary>" [--set KEY=VALUE ...]',
				who: 'Human — approval gate #2, own gh auth',
				when: 'Scaffolds the repo from a template, runs `gh repo create`, applies templates/_shared/labels.json, and appends the project to projects.json (locally — does not push).',
				source: 'scripts/factory-new.sh'
			},
			{
				command: 'scripts/factory-secrets.sh <repo-name>',
				who: 'Human — same gate as above',
				when: 'Sets CLAUDE_CODE_OAUTH_TOKEN (from the local .env store) and a freshly minted, never-persisted GH_PAT (prompted interactively, input hidden) as Actions secrets on the new repo.',
				source: 'scripts/factory-secrets.sh'
			},
			{
				command: 'git add projects.json && git commit -m "Register <owner>/<slug>" && git push',
				who: 'Human — same gate as above',
				when: 'Pushes the projects.json entry factory-new.sh wrote locally, so the dashboard picks up the new project.',
				source: 'scripts/factory-new.sh writes projects.json; this command pushes it'
			}
		]
	},
	{
		stage: 'Seed milestones & issues',
		commands: [
			{
				command: 'gh workflow run seed-milestones.yml -R <owner>/<repo-name>',
				who: 'Human — manual trigger, no inputs (Actions tab → seed-milestones → Run workflow works the same way)',
				when: "Fetches the approved design doc from ai-app-factory-v2's public main over an unauthenticated raw.githubusercontent.com request, then creates one milestone per doc milestone and one or more claude-go-labeled issues per milestone, using the new repo's own secrets.",
				source: 'templates/<type>/.github/workflows/seed-milestones.yml'
			},
			{
				command: 'gh api repos/<owner>/<repo>/milestones -f title=... -f description=...',
				who: 'Workflow (seed-milestones.yml)',
				when: 'Creates one GitHub milestone per "## Milestones" bullet in the design doc; skips any title that already exists.',
				source: 'templates/<type>/.github/workflows/seed-milestones.yml'
			},
			{
				command: 'gh issue create --title ... --milestone "M<n>: <title>" --body ...',
				who: 'Workflow (seed-milestones.yml)',
				when: 'Files one or more issues per milestone with an acceptance-criteria checklist; applies claude-go only to issues concrete enough for the unattended pipeline.',
				source: 'templates/<type>/.github/workflows/seed-milestones.yml'
			}
		]
	},
	{
		stage: 'Review & decisions during the build',
		commands: [
			{
				command: 'gh issue create --repo <owner>/<repo> --title "[review-approve] PR #<n>"',
				who: 'Human — the project’s own recorded requester, or the repo owner (via the "Pending decisions" section on that project’s dashboard page, a pre-filled link — or hand-constructed)',
				when: 'review-decision.yml triggers on issues: opened, filtered to a [review-approve]/[review-reject] title prefix (not a label — same labels=-is-dropped-for-non-collaborators reasoning as intake). Parses the referenced PR number from the title and merges (squash + delete branch) if authorized.',
				source: 'templates/<type>/.github/workflows/review-decision.yml'
			},
			{
				command: 'gh issue create --repo <owner>/<repo> --title "[review-reject] PR #<n>"',
				who: 'Human — same authorization as above',
				when: 'Same mechanism, opposite action: closes the referenced PR without merging and deletes its branch.',
				source: 'templates/<type>/.github/workflows/review-decision.yml'
			},
			{
				command:
					"grep -oE '\\[@[A-Za-z0-9-]+\\]\\(https://github\\.com/[A-Za-z0-9-]+\\)' README.md || true",
				who: 'Workflow (review-decision.yml and claude.yml’s Authorize step, in every generated project)',
				when: 'Recovers the project’s recorded requester login from its own README "Requested by" line — the only source of truth for who besides a collaborator is allowed to approve/reject a PR or direct changes via @claude. The trailing `|| true` tolerates zero matches so a repo predating that line falls through to collaborator/owner-only instead of killing the step under `set -e`/`pipefail`.',
				source: 'templates/<type>/.github/workflows/review-decision.yml'
			}
		]
	}
];

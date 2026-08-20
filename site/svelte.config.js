import adapter from '@sveltejs/adapter-static';

export default {
	compilerOptions: {
		runes: true
	},

	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: true
		}),
		paths: {
			// Custom-domain-root deploy, not a project-pages subpath -- and unconditionally so,
			// per DESIGN.md's "Lessons carried forward": the predecessor (`ai-app-factory`)
			// shipped `base: '/ai-app-factory'` baked in from its own M3, which silently broke
			// every built asset URL the moment its custom domain was configured (the HTML shell
			// still loaded, so the breakage looked like nothing at a glance -- it was every JS/CSS
			// 404ing). This repo is served from the custom domain ai-app-factory-v2.coldwire.uk
			// (see the repo-root CNAME file and Settings -> Pages -> Custom domain), at the domain
			// root, so `base` stays `''` from the start. If this repo is ever actually served from
			// `<owner>.github.io/ai-app-factory-v2/` instead of the custom domain, this needs to
			// become the repo name as a subpath (`base: '/ai-app-factory-v2'`) -- don't "fix" it
			// the other way without first checking which URL is actually live (see README.md's
			// "Setup" section, step 3).
			base: ''
		},
		prerender: {
			// `/projects/[owner]/[name]`'s own `entries()` (see that route's `+page.js`) returns
			// one path per row in the root `projects.json` registry -- correctly zero right now,
			// since this repo starts with an empty registry (`projects.json: []`) before any
			// project has been provisioned. adapter-static's default `handleUnseenRoutes`
			// ('fail') can't distinguish "this dynamic route legitimately has no entries yet"
			// from "a route was missed" and errors the build either way once `entries()` returns
			// nothing and nothing else links to it. Silencing the warning specifically for that
			// one route (not globally) keeps the build green on a fresh, project-less registry
			// without hiding an unseen-route problem anywhere else in the site.
			handleUnseenRoutes: ({ routes }) => {
				const unexpected = routes.filter((id) => id !== '/projects/[owner]/[name]');
				if (unexpected.length > 0) {
					throw new Error(
						`The following routes were marked as prerenderable, but were not prerendered ` +
							`because they were not found while crawling your app:\n` +
							unexpected.map((id) => `  - ${id}`).join('\n')
					);
				}
			}
		}
	}
};

import { error } from '@sveltejs/kit';
import { PROJECTS, findProject } from '$lib/projects.js';

export const prerender = true;

// Two path segments (owner, name), not one with an encoded slash -- GitHub Pages (like most
// static hosts) decodes %2F in the URL path before matching it to files on disk, so a single
// `[repo]` segment built from `encodeURIComponent('owner/name')` prerenders a file GitHub
// Pages can never actually serve: every project page 404s live even though the file exists.
// DESIGN.md's "Lessons carried forward" records this as a real bug in the predecessor
// (`ai-app-factory`), found live only after the collapsed-route form had already shipped and
// gone unnoticed for a while -- nobody had clicked through a deployed project link, only ever
// hit the routes via direct API/gh CLI checks. This repo starts with the two-segment route
// from its own M3, not as a later fix.
export function entries() {
	return PROJECTS.map((project) => {
		const [owner, name] = project.repo.split('/');
		return { owner, name };
	});
}

export function load({ params }) {
	const repo = `${params.owner}/${params.name}`;
	const project = findProject(repo);
	if (!project) {
		error(404, `Unknown project: ${repo}`);
	}
	return { project };
}

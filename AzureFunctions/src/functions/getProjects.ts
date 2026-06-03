import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { DUMMY_PROJECTS } from '../data/dummyData';

/**
 * GET /api/projects
 * Returns the list of subdivisions / projects (with their phases).
 *
 * @remarks
 * Stub implementation — replace with MongoDB query against the `projects`
 * collection when persistence is wired up.
 */
export async function getProjects(
  _req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('GET /api/projects');
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: DUMMY_PROJECTS
  };
}

app.http('getProjects', {
  route: 'projects',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getProjects
});
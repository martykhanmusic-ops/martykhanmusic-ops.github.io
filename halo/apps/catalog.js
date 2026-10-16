import * as workspaceStatus from './workspace-status.js';

// Add a trusted local app by adding its module here. The host and project store
// need no app-specific branches. Do not load untrusted code from manifests.
export const appModules = [workspaceStatus];

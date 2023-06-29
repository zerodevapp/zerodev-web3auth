import { BACKEND_URL } from "./constants";
import { ProjectConfiguration } from "./types";

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || !window.navigator) return false;
  const userAgent = navigator.userAgent;

  // Regex to check for common mobile device identifiers in the user agent string
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  return mobileRegex.test(userAgent);
}

const projectConfigurationCache: { [key: string]: Promise<ProjectConfiguration> } = {}

export const getProjectsConfiguration = async (
  projectIds: string[],
  backendUrl?: string
): Promise<ProjectConfiguration> => {
  // If the result is already cached, return it
  const projectIdsKey = projectIds.join('-')
  if (projectConfigurationCache[projectIdsKey] === undefined) {
    projectConfigurationCache[projectIdsKey] = new Promise<ProjectConfiguration>((resolve, reject) => {
      fetch(
        `${backendUrl ?? BACKEND_URL}/v1/projects/get`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectIds: projectIds.map(projectId => projectId.toString())
          })
        }
      ).then(resp => {
        resp.json().then(resolve).catch(reject)
      }).catch(reject)
    })
  }
  return await projectConfigurationCache[projectIdsKey]
}
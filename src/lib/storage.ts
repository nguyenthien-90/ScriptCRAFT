import { ProjectState } from '../types';

const STORAGE_KEY = 'scriptcraft_projects';

export function saveProjectToStorage(project: ProjectState) {
  const existing = getAllProjects();
  const index = existing.findIndex(p => p.id === project.id);
  
  if (index >= 0) {
    existing[index] = { ...project, updatedAt: new Date().toISOString() };
  } else {
    existing.push({ ...project, updatedAt: new Date().toISOString() });
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

export function getAllProjects(): (ProjectState & { updatedAt: string })[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function deleteProjectFromStorage(id: string) {
  const existing = getAllProjects();
  const filtered = existing.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

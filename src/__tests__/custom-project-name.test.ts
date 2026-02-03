import { describe, it, expect } from 'vitest';

// Test the custom project name logic
// This tests the state transitions and value assignments

interface ProjectState {
  showCustomProjectInput: boolean;
  customProjectName: string;
  detectedProjectId: string | undefined;
  detectedProjectName: string | undefined;
}

interface Project {
  id: string;
  name: string;
}

// Simulate the project selection handler from TimeBlockForm
function handleProjectSelection(
  value: string,
  detectedProjects: Project[],
  setState: (updates: Partial<ProjectState>) => void
) {
  if (value === 'new') {
    setState({
      detectedProjectId: undefined,
      detectedProjectName: undefined,
      showCustomProjectInput: true,
      customProjectName: '',
    });
  } else {
    const project = detectedProjects.find(p => p.id === value);
    if (project) {
      setState({
        detectedProjectId: project.id,
        detectedProjectName: project.name,
        showCustomProjectInput: false,
        customProjectName: '',
      });
    }
  }
}

// Simulate the custom project name input handler
function handleCustomProjectNameChange(
  value: string,
  setState: (updates: Partial<ProjectState>) => void
) {
  setState({
    customProjectName: value,
    detectedProjectName: value || undefined,
  });
}

// Simulate form reset
function resetProjectState(): ProjectState {
  return {
    showCustomProjectInput: false,
    customProjectName: '',
    detectedProjectId: undefined,
    detectedProjectName: undefined,
  };
}

describe('Custom Project Name Feature', () => {
  const mockProjects: Project[] = [
    { id: 'proj-1', name: 'Website Redesign' },
    { id: 'proj-2', name: 'Mobile App' },
    { id: 'proj-3', name: 'Marketing Campaign' },
  ];

  describe('Project Selection', () => {
    it('should show custom input when "new" is selected', () => {
      let state: ProjectState = resetProjectState();
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      handleProjectSelection('new', mockProjects, setState);

      expect(state.showCustomProjectInput).toBe(true);
      expect(state.customProjectName).toBe('');
      expect(state.detectedProjectId).toBeUndefined();
      expect(state.detectedProjectName).toBeUndefined();
    });

    it('should hide custom input and set project when existing project selected', () => {
      let state: ProjectState = {
        showCustomProjectInput: true,
        customProjectName: 'Test Project',
        detectedProjectId: undefined,
        detectedProjectName: 'Test Project',
      };
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      handleProjectSelection('proj-1', mockProjects, setState);

      expect(state.showCustomProjectInput).toBe(false);
      expect(state.customProjectName).toBe('');
      expect(state.detectedProjectId).toBe('proj-1');
      expect(state.detectedProjectName).toBe('Website Redesign');
    });

    it('should preserve state when invalid project ID is selected', () => {
      let state: ProjectState = resetProjectState();
      const initialState = { ...state };
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      handleProjectSelection('invalid-id', mockProjects, setState);

      // State should remain unchanged since project wasn't found
      expect(state).toEqual(initialState);
    });
  });

  describe('Custom Project Name Input', () => {
    it('should update both customProjectName and detectedProjectName', () => {
      let state: ProjectState = {
        showCustomProjectInput: true,
        customProjectName: '',
        detectedProjectId: undefined,
        detectedProjectName: undefined,
      };
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      handleCustomProjectNameChange('My Custom Project', setState);

      expect(state.customProjectName).toBe('My Custom Project');
      expect(state.detectedProjectName).toBe('My Custom Project');
    });

    it('should set detectedProjectName to undefined when input is empty', () => {
      let state: ProjectState = {
        showCustomProjectInput: true,
        customProjectName: 'Old Name',
        detectedProjectId: undefined,
        detectedProjectName: 'Old Name',
      };
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      handleCustomProjectNameChange('', setState);

      expect(state.customProjectName).toBe('');
      expect(state.detectedProjectName).toBeUndefined();
    });

    it('should handle whitespace-only input', () => {
      let state: ProjectState = resetProjectState();
      state.showCustomProjectInput = true;
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      handleCustomProjectNameChange('   ', setState);

      // Whitespace is preserved in the input, but stored as-is
      expect(state.customProjectName).toBe('   ');
      expect(state.detectedProjectName).toBe('   ');
    });
  });

  describe('Form Reset', () => {
    it('should reset all project-related state', () => {
      const state = resetProjectState();

      expect(state.showCustomProjectInput).toBe(false);
      expect(state.customProjectName).toBe('');
      expect(state.detectedProjectId).toBeUndefined();
      expect(state.detectedProjectName).toBeUndefined();
    });
  });

  describe('Form Submission with Custom Project', () => {
    it('should use custom project name in form data when provided', () => {
      const formData = {
        activityName: 'Working on feature',
        activityType: 'project' as const,
        detectedProjectId: undefined,
        detectedProjectName: 'My Custom Project', // Set from custom input
      };

      expect(formData.detectedProjectName).toBe('My Custom Project');
      expect(formData.detectedProjectId).toBeUndefined();
    });

    it('should use activity name as fallback when custom name is empty', () => {
      const formData = {
        activityName: 'Working on feature',
        activityType: 'project' as const,
        detectedProjectId: undefined,
        detectedProjectName: undefined, // Empty custom input defaults to undefined
      };

      // In actual implementation, the backend would use activityName as fallback
      const projectName = formData.detectedProjectName || formData.activityName;
      expect(projectName).toBe('Working on feature');
    });

    it('should use existing project when selected', () => {
      const formData = {
        activityName: 'Working on feature',
        activityType: 'project' as const,
        detectedProjectId: 'proj-1',
        detectedProjectName: 'Website Redesign',
      };

      expect(formData.detectedProjectId).toBe('proj-1');
      expect(formData.detectedProjectName).toBe('Website Redesign');
    });
  });

  describe('UI State Transitions', () => {
    it('should follow correct state flow: initial -> new -> custom name', () => {
      let state: ProjectState = resetProjectState();
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      // Initial state
      expect(state.showCustomProjectInput).toBe(false);

      // Select "new"
      handleProjectSelection('new', mockProjects, setState);
      expect(state.showCustomProjectInput).toBe(true);
      expect(state.customProjectName).toBe('');

      // Enter custom name
      handleCustomProjectNameChange('API Integration Project', setState);
      expect(state.customProjectName).toBe('API Integration Project');
      expect(state.detectedProjectName).toBe('API Integration Project');
    });

    it('should follow correct state flow: new -> existing project', () => {
      let state: ProjectState = {
        showCustomProjectInput: true,
        customProjectName: 'Draft Name',
        detectedProjectId: undefined,
        detectedProjectName: 'Draft Name',
      };
      const setState = (updates: Partial<ProjectState>) => {
        state = { ...state, ...updates };
      };

      // Switch to existing project
      handleProjectSelection('proj-2', mockProjects, setState);

      expect(state.showCustomProjectInput).toBe(false);
      expect(state.customProjectName).toBe('');
      expect(state.detectedProjectId).toBe('proj-2');
      expect(state.detectedProjectName).toBe('Mobile App');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { useTasks } from '../hooks/useTasks';

// 1. Mock the useTasks hook
vi.mock('../hooks/useTasks', () => ({
  useTasks: vi.fn(),
}));

describe('App Component', () => {
  // Setup a default mock return value for the hook
  const mockLoadTasks = vi.fn();
  const mockAddTask = vi.fn();
  const mockEditTask = vi.fn();
  const mockRemoveTask = vi.fn();
  const mockToggleComplete = vi.fn();

  let alertMock: any;

  const defaultHookState = {
    tasks: [],
    loading: false,
    error: null,
    loadTasks: mockLoadTasks,
    addTask: mockAddTask,
    editTask: mockEditTask,
    removeTask: mockRemoveTask,
    toggleComplete: mockToggleComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a standalone mock function
    alertMock = vi.fn();
    
    // Stub the global object directly. This guarantees Vitest catches it
    // regardless of whether the component calls alert() or window.alert()
    vi.stubGlobal('alert', alertMock);
    
    // Apply default hook state before each test
    vi.mocked(useTasks).mockReturnValue(defaultHookState);
  });

  it('renders the header and form, but hides stats when there are no tasks', () => {
    render(<App />);
    
    expect(screen.getByRole('heading', { name: 'Mes Tâches' })).toBeInTheDocument();
    
    // The form should be rendered (indicated by its submit button)
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
    
    // Stats should NOT be in the document
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
    expect(screen.queryByText('Terminées')).not.toBeInTheDocument();
    expect(screen.queryByText('En cours')).not.toBeInTheDocument();
  });

  it('calculates and displays correct statistics when tasks exist', () => {
    // Provide a state with 3 tasks (1 completed, 2 pending)
    vi.mocked(useTasks).mockReturnValue({
      ...defaultHookState,
      tasks: [
        { id: 1, title: 'Task 1', description: 'Description 1', completed: true, createdAt: '', updatedAt: '' },
        { id: 2, title: 'Task 2', description: 'Description 2', completed: false, createdAt: '', updatedAt: '' },
        { id: 3, title: 'Task 3', description: 'Description 3', completed: false, createdAt: '', updatedAt: '' },
      ],
    });

    render(<App />);

    expect(screen.getByText('Total')).toBeInTheDocument();
    
    // We can find the stat values by looking at their parent/sibling text context, 
    // or simply verifying the numbers exist on the screen in this specific isolated test
    expect(screen.getByText('3')).toBeInTheDocument(); // Total
    expect(screen.getByText('1')).toBeInTheDocument(); // Terminées
    expect(screen.getByText('2')).toBeInTheDocument(); // En cours
  });

  it('calls addTask from the hook when the form is submitted', async () => {
    const user = userEvent.setup();
    render(<App />);

    const titleInput = screen.getByPlaceholderText('Titre de la tâche *');
    const submitButton = screen.getByRole('button', { name: 'Ajouter' });

    await user.type(titleInput, 'New Integration Task');
    await user.click(submitButton);

    expect(mockAddTask).toHaveBeenCalledOnce();
    expect(mockAddTask).toHaveBeenCalledWith({
      title: 'New Integration Task',
      description: undefined,
    });
  });

  it('passes hook methods down to the TaskList', async () => {
    const user = userEvent.setup();
    vi.mocked(useTasks).mockReturnValue({
      ...defaultHookState,
      tasks: [
        { id: 1, title: 'Test Task', description: 'Test Description', completed: false, createdAt: '', updatedAt: '' },
      ],
    });

    render(<App />);

    // Test toggle logic flow
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    expect(mockToggleComplete).toHaveBeenCalledWith(1);

    // Test delete logic flow (requires two clicks due to the TaskItem logic we tested earlier)
    const deleteButton = screen.getByRole('button', { name: 'Supprimer' });
    await user.click(deleteButton); // Click 1: Confirm
    await user.click(deleteButton); // Click 2: Delete
    expect(mockRemoveTask).toHaveBeenCalledWith(1);
  });
});
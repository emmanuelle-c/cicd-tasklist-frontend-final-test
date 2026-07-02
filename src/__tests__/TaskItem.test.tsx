import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from '../components/TaskItem';

describe('TaskItem', () => {
  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnEdit = vi.fn();

  // A standard mock task to use across tests
  const mockTask = {
    id: 1,
    title: 'Faire les courses',
    description: 'Acheter du lait et du pain',
    completed: false,
    createdAt: '2026-06-25T10:00:00Z', // Using a fixed date for reliable formatting tests
    updatedAt: '2026-06-25T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Ensure real timers are restored after any tests that use fake timers
    vi.useRealTimers();
  });

  it('renders the task details correctly', () => {
    render(
      <TaskItem 
        task={mockTask} 
        onToggle={mockOnToggle} 
        onDelete={mockOnDelete} 
        onEdit={mockOnEdit} 
      />
    );

    expect(screen.getByText('Faire les courses')).toBeInTheDocument();
    expect(screen.getByText('Acheter du lait et du pain')).toBeInTheDocument();
    
    // Check that the date formatted correctly in French (fr-FR)
    expect(screen.getByText('25 juin 2026')).toBeInTheDocument();
    
    // Check that the checkbox is unchecked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('applies completed styling when the task is done', () => {
    const completedTask = { ...mockTask, completed: true };
    render(
      <TaskItem 
        task={completedTask} 
        onToggle={mockOnToggle} 
        onDelete={mockOnDelete} 
        onEdit={mockOnEdit} 
      />
    );

    const taskContainer = screen.getByTestId('task-item');
    expect(taskContainer).toHaveClass('task-completed');
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onToggle when the checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TaskItem 
        task={mockTask} 
        onToggle={mockOnToggle} 
        onDelete={mockOnDelete} 
        onEdit={mockOnEdit} 
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledOnce();
    expect(mockOnToggle).toHaveBeenCalledWith(mockTask.id);
  });

  it('enters edit mode and saves modified values', async () => {
    const user = userEvent.setup();
    render(
      <TaskItem 
        task={mockTask} 
        onToggle={mockOnToggle} 
        onDelete={mockOnDelete} 
        onEdit={mockOnEdit} 
      />
    );

    // Click the edit icon
    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    // Verify we are in edit mode
    const titleInput = screen.getByPlaceholderText('Titre de la tâche');
    const descInput = screen.getByPlaceholderText('Description (optionnel)');
    
    expect(titleInput).toHaveValue('Faire les courses');

    // Make edits
    await user.clear(titleInput);
    await user.type(titleInput, 'Faire le ménage');
    await user.clear(descInput);
    await user.type(descInput, 'Nettoyer le salon');

    // Save
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    // Verify the correct payload was sent
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask.id, {
      title: 'Faire le ménage',
      description: 'Nettoyer le salon',
    });
  });

  it('does not save if the title is empty', async () => {
    const user = userEvent.setup();
    render(
      <TaskItem 
        task={mockTask} 
        onToggle={mockOnToggle} 
        onDelete={mockOnDelete} 
        onEdit={mockOnEdit} 
      />
    );

    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    const titleInput = screen.getByPlaceholderText('Titre de la tâche');
    await user.clear(titleInput); // Empty the title

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    // Verify onEdit was prevented
    expect(mockOnEdit).not.toHaveBeenCalled();
    
    // Verify we are still in edit mode (the input is still there)
    expect(screen.getByPlaceholderText('Titre de la tâche')).toBeInTheDocument();
  });

  it('cancels edit mode and resets values', async () => {
    const user = userEvent.setup();
    render(
      <TaskItem 
        task={mockTask} 
        onToggle={mockOnToggle} 
        onDelete={mockOnDelete} 
        onEdit={mockOnEdit} 
      />
    );

    await user.click(screen.getByRole('button', { name: 'Modifier' }));

    const titleInput = screen.getByPlaceholderText('Titre de la tâche');
    await user.clear(titleInput);
    await user.type(titleInput, 'Oops mistake');

    // Cancel the edit
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    // Verify we exited edit mode and onEdit was not called
    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('Titre de la tâche')).not.toBeInTheDocument();
    
    // Verify the original title is displayed again
    expect(screen.getByText('Faire les courses')).toBeInTheDocument();
  });

  it('requires two clicks to delete a task', async () => {
    const user = userEvent.setup();
    render(
      <TaskItem 
        task={mockTask} 
        onToggle={mockOnToggle} 
        onDelete={mockOnDelete} 
        onEdit={mockOnEdit} 
      />
    );

    const deleteButton = screen.getByRole('button', { name: 'Supprimer' });

    // First click (Confirmation step)
    await user.click(deleteButton);
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(deleteButton).toHaveTextContent('⚠️'); // Assuming this emoji represents the confirm state

    // Second click (Actual delete)
    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledOnce();
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });
});
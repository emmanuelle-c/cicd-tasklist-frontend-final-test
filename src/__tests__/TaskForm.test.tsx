import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form in create mode by default', () => {
    render(<TaskForm onSubmit={mockOnSubmit} />);
    
    // Assert headers and inputs are present
    expect(screen.getByRole('heading', { name: 'Nouvelle tâche' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Titre de la tâche *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description (optionnel)')).toBeInTheDocument();
    
    // Assert default buttons
    expect(screen.getByRole('button', { name: 'Ajouter' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
  });

  it('renders the form in edit mode with initial values and cancel button', () => {
    render(
      <TaskForm 
        onSubmit={mockOnSubmit} 
        mode="edit" 
        initialValues={{ title: 'Existing Task', description: 'Existing Desc' }} 
        onCancel={mockOnCancel}
      />
    );
    
    // Check mode text
    expect(screen.getByRole('heading', { name: 'Modifier la tâche' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();

    // Check that values populated
    expect(screen.getByDisplayValue('Existing Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Desc')).toBeInTheDocument();
  });

  it('shows a validation error when submitting an empty title', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Ajouter' });
    await user.click(submitButton);

    // Expect the error message to appear
    expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
    
    // Ensure the submit function was completely blocked
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('clears the validation error when the user types in the title field', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByRole('button', { name: 'Ajouter' });
    const titleInput = screen.getByPlaceholderText('Titre de la tâche *');

    // Trigger the error first
    await user.click(submitButton);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Type a character
    await user.type(titleInput, 'A');
    
    // The alert should disappear
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('submits valid data and clears the inputs in "create" mode', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByPlaceholderText('Titre de la tâche *');
    const descInput = screen.getByPlaceholderText('Description (optionnel)');
    const submitButton = screen.getByRole('button', { name: 'Ajouter' });

    await user.type(titleInput, 'New Task');
    await user.type(descInput, 'New Description');
    await user.click(submitButton);

    // Verify correct payload was sent
    expect(mockOnSubmit).toHaveBeenCalledOnce();
    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'New Description',
    });

    // Verify fields were reset based on your `if (mode === 'create')` block
    expect(titleInput).toHaveValue('');
    expect(descInput).toHaveValue('');
  });

  it('submits valid data but does NOT clear the inputs in "edit" mode', async () => {
    const user = userEvent.setup();
    render(
      <TaskForm 
        onSubmit={mockOnSubmit} 
        mode="edit" 
        initialValues={{ title: 'Old Title', description: 'Old Desc' }} 
      />
    );
    
    const titleInput = screen.getByPlaceholderText('Titre de la tâche *');
    const submitButton = screen.getByRole('button', { name: 'Modifier' });

    // Change the title
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');
    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'Updated Title',
      description: 'Old Desc',
    });

    // Verify fields were NOT reset
    expect(titleInput).toHaveValue('Updated Title');
  });

  it('trims whitespace from the title and description before submitting', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} />);
    
    const titleInput = screen.getByPlaceholderText('Titre de la tâche *');
    const descInput = screen.getByPlaceholderText('Description (optionnel)');
    const submitButton = screen.getByRole('button', { name: 'Ajouter' });

    await user.type(titleInput, '   Messy Title   ');
    await user.type(descInput, '   Messy Desc   ');
    await user.click(submitButton);

    // Assert that the .trim() logic worked
    expect(mockOnSubmit).toHaveBeenCalledWith({
      title: 'Messy Title',
      description: 'Messy Desc',
    });
  });

  it('calls onCancel when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Annuler' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledOnce();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});
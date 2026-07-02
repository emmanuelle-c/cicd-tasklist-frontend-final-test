import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import { act, renderHook } from '@testing-library/react';


import * as taskApi from '../api/taskApi';
vi.mock('../api/taskApi');

describe('useTasks', () => {
    beforeEach(() => {
        // Clear mocks before every test to prevent data from bleeding over
        vi.clearAllMocks();
    });

    it('should fetch tasks on mount', async () => {
        // Setup: Tell the mocked API to return an empty array
        vi.mocked(taskApi.getTasks).mockResolvedValue([]);
        
        const { result } = renderHook(() => useTasks());
        await act(() => result.current.loadTasks());
        
        expect(result.current.tasks).toHaveLength(0);
    });

    it('should add a task', async () => {
        const mockNewTask = { 
            id: 1, 
            title: 'New Task', 
            description: 'New Task Description', 
            completed: false,
            createdAt: '2026-01-15T10:00:00Z',
            updatedAt: '2026-01-15T10:00:00Z' 
        };
        
        vi.mocked(taskApi.createTask).mockResolvedValue(mockNewTask);

        const { result } = renderHook(() => useTasks());
        

        await act(async () => {
            await result.current.addTask({ 
                title: 'New Task', 
                description: 'New Task Description' 
            });
        });
        
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0]).toEqual(mockNewTask);


        expect(taskApi.createTask).toHaveBeenCalledWith({
            title: 'New Task',
            description: 'New Task Description'
        });
    });

    it('should edit a task', async () => {
        const mockInitialTask = { id: 1, title: 'Old Title', description: 'Old', completed: false, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' };
        const mockUpdatedTask = { ...mockInitialTask, title: 'Updated Task', description: 'Updated Description' };
        

        vi.mocked(taskApi.getTasks).mockResolvedValue([mockInitialTask]);
        vi.mocked(taskApi.updateTask).mockResolvedValue(mockUpdatedTask);

        const { result } = renderHook(() => useTasks());
        
        await act(async () => {
            await result.current.loadTasks();
        });

        await act(async () => {
            await result.current.editTask(1, { title: 'Updated Task', description: 'Updated Description' });
        });

        expect(result.current.tasks[0]).toEqual(mockUpdatedTask);
    });

    it('should delete a task', async () => {
        // Setup: Start with one task in the list
        const mockTask = { id: 1, title: 'To Be Deleted', description: '', completed: false, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' };
        vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);
        vi.mocked(taskApi.deleteTask).mockResolvedValue(); // Assuming delete returns void or success status

        const { result } = renderHook(() => useTasks());
        
        await act(async () => {
            await result.current.loadTasks();
        });

        // Act: Delete the task
        await act(async () => {
            await result.current.removeTask(1);
        });

        // Assert: The list should now be empty (0, not 1)
        expect(result.current.tasks).toHaveLength(0);
    });

    it('should toggle task completion', async () => {
        const mockTask = { id: 1, title: 'Do Laundry', description: '', completed: false, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' };
        const mockToggledTask = { ...mockTask, completed: true };
        
        vi.mocked(taskApi.getTasks).mockResolvedValue([mockTask]);
        vi.mocked(taskApi.updateTask).mockResolvedValue(mockToggledTask);

        const { result } = renderHook(() => useTasks());
        
        await act(async () => {
            await result.current.loadTasks();
        });

        await act(async () => {
            await result.current.toggleComplete(1);
        });

        expect(result.current.tasks[0].completed).toBe(true);
    });
});
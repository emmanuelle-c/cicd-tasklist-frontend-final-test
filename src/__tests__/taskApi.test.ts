import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasks, createTask, updateTask, deleteTask } from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve([mockTask]),
			})
		);

		const tasks = await getTasks();
		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/tasks');
	});

	it('createTask returns a created task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			})
		);

		const task = await createTask({ title: 'Test' });
		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'Test' }),
		});
	});

	it('updateTask returns the updates task', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockTask),
			})
		);

		const task = await updateTask(1, { title: 'Updated' });
		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/tasks/1', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ title: 'Updated' }),
		});
	});

	it('deleteTask returns void', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				text: () => Promise.resolve(''),
			})
		);

		await deleteTask(1);
		expect(fetch).toHaveBeenCalledWith('http://localhost:3001/api/tasks/1', {
			method: 'DELETE',
		});
	});
});

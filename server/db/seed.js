import { get, run } from './client.js';

export const seedInitialData = () => {
  const existing = get('SELECT id FROM users WHERE id = @id;', { id: 'system' });
  if (!existing) {
    run('INSERT INTO users (id, name) VALUES (@id, @name);', {
      id: 'system',
      name: 'HOTJAVA System',
    });
  }
};

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (prismaInstance) return prismaInstance;
  
  const connectionString = process.env.DATABASE_URL;
  
  if (connectionString) {
    try {
      const pool = new Pool({ connectionString });
      const adapter = new PrismaPg(pool);
      prismaInstance = new PrismaClient({ 
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });
      console.log('Database connected');
    } catch (e) {
      console.warn('Failed to connect to database:', e);
      throw new Error('Database connection failed');
    }
  } else {
    throw new Error('DATABASE_URL not set. Please configure your database connection.');
  }
  
  return prismaInstance;
}

export function resetPrisma() {
  if (prismaInstance) {
    prismaInstance.$disconnect();
    prismaInstance = null;
  }
}

export const prisma = getPrisma();
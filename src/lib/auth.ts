import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { getPrisma } from '@/lib/db';
import { emailOTP } from 'better-auth/plugins';
import { sendEmail } from '@/lib/email';

// Lazy initialization for Prisma adapter
function getPrismaAdapter() {
  try {
    const prisma = getPrisma();
    return prismaAdapter(prisma, { provider: 'postgresql' });
  } catch {
    // Return a mock adapter for development without database
    return {
      findUser: async () => null,
      createUser: async () => ({ id: 'mock-user', email: 'mock@example.com' }),
      updateUser: async () => ({}),
      deleteUser: async () => ({}),
      linkAccount: async () => ({}),
      unlinkAccount: async () => ({}),
      createSession: async () => ({ id: 'mock-session', userId: 'mock-user' }),
      deleteSession: async () => ({}),
      getSession: async () => null,
      // Add other required methods
    } as any;
  }
}

export const auth = betterAuth({
  database: getPrismaAdapter(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await sendEmail({
          to: email,
          subject: 'Your Locket verification code',
          html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p>`,
        });
      },
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];
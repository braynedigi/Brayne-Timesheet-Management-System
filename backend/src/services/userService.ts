import { PrismaClient, User, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export class UserService {
  static async createUser(data: CreateUserData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async getUsers(filters: UserFilters = {}, page = 1, limit = 10) {
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              timesheets: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            timesheets: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateUser(id: string, data: UpdateUserData) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('User with this email already exists');
      }
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async deleteUser(id: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        timesheets: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.timesheets.length > 0) {
      throw new Error('Cannot delete user with existing timesheets');
    }

    await prisma.user.delete({
      where: { id },
    });
  }

  static async getUserStats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        timesheets: {
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalHours = user.timesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0);
    const totalEntries = user.timesheets.length;
    const uniqueDays = new Set(user.timesheets.map(ts => ts.date));
    const averageHoursPerDay = totalHours / uniqueDays.size;

    const projectBreakdown = user.timesheets.reduce((acc, ts) => {
      const projectName = ts.project.name;
      acc[projectName] = (acc[projectName] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    const typeBreakdown = user.timesheets.reduce((acc, ts) => {
      acc[ts.type] = (acc[ts.type] || 0) + Number(ts.hoursWorked);
      return acc;
    }, {} as Record<string, number>);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      stats: {
        totalHours,
        totalEntries,
        averageHoursPerDay,
        activeDays: uniqueDays.size,
        projectBreakdown,
        typeBreakdown,
      },
    };
  }
}

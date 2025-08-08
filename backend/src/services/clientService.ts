import { PrismaClient, Client } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateClientData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ClientFilters {
  search?: string;
  isActive?: boolean;
}

export class ClientService {
  static async createClient(data: CreateClientData): Promise<Client> {
    const existingClient = await prisma.client.findUnique({
      where: { email: data.email },
    });

    if (existingClient) {
      throw new Error('Client with this email already exists');
    }

    return prisma.client.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        isActive: true,
      },
    });
  }

  static async getClients(filters: ClientFilters = {}, page = 1, limit = 10) {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    return {
      clients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    };
  }

  static async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    return client;
  }

  static async updateClient(id: string, data: UpdateClientData): Promise<Client> {
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new Error('Client not found');
    }

    if (data.email && data.email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        throw new Error('Client with this email already exists');
      }
    }

    return prisma.client.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async deleteClient(id: string): Promise<void> {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            timesheets: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Check if client has projects with timesheets
    const hasTimesheets = client.projects.some(project => project.timesheets.length > 0);
    if (hasTimesheets) {
      throw new Error('Cannot delete client with projects that have timesheets');
    }

    await prisma.client.delete({
      where: { id },
    });
  }

  static async getClientStats(clientId: string) {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        projects: {
          include: {
            timesheets: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const totalProjects = client.projects.length;
    const totalHours = client.projects.reduce((sum, project) => {
      return sum + project.timesheets.reduce((projectSum, ts) => projectSum + Number(ts.hoursWorked), 0);
    }, 0);

    const totalTimesheets = client.projects.reduce((sum, project) => sum + project.timesheets.length, 0);

    const projectBreakdown = client.projects.map(project => ({
      name: project.name,
      hours: project.timesheets.reduce((sum, ts) => sum + Number(ts.hoursWorked), 0),
      timesheets: project.timesheets.length,
    }));

    const userBreakdown = client.projects.reduce((acc, project) => {
      project.timesheets.forEach(ts => {
        const userName = `${ts.user.firstName} ${ts.user.lastName}`;
        acc[userName] = (acc[userName] || 0) + Number(ts.hoursWorked);
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      stats: {
        totalProjects,
        totalHours,
        totalTimesheets,
        projectBreakdown,
        userBreakdown,
      },
    };
  }
}

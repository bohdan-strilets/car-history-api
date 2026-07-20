import { TIME_UNITS } from '@common/constants';
import { ConflictException, ForbiddenException, NotFoundException } from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { MailService } from '@modules/mail';
import { UsersService } from '@modules/users/users.service';
import { VehiclesService } from '@modules/vehicles';
import { Test, TestingModule } from '@nestjs/testing';
import { InviteStatus, Role, UserStatus, Workspace } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import {
  CreateInviteDto,
  CreateWorkspaceDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceSettingsDto,
} from './dto';
import { WorkspaceInvitesRepo } from './workspace-invites.repository';
import { WorkspaceMembersRepo } from './workspace-members.repository';
import { WorkspaceSettingsRepo } from './workspace-settings.repository';
import { WorkspacesRepo } from './workspaces.repository';
import { WorkspacesService } from './workspaces.service';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let workspacesRepo: jest.Mocked<WorkspacesRepo>;
  let workspaceMembersRepo: jest.Mocked<WorkspaceMembersRepo>;
  let workspaceSettingsRepo: jest.Mocked<WorkspaceSettingsRepo>;
  let workspaceInvitesRepo: jest.Mocked<WorkspaceInvitesRepo>;
  let usersService: jest.Mocked<UsersService>;
  let vehiclesService: jest.Mocked<VehiclesService>;
  let mailService: jest.Mocked<MailService>;
  let config: jest.Mocked<AppConfigService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockWorkspace = {
    id: 'workspace-123',
    name: 'Test Workspace',
    type: 'PERSONAL',
    ownerId: 'user-123',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Workspace;

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    status: UserStatus.ACTIVE,
  };

  const mockMember = {
    id: 'member-123',
    workspaceId: 'workspace-123',
    userId: 'user-123',
    role: Role.OWNER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSettings = {
    id: 'settings-123',
    workspaceId: 'workspace-123',
    currency: 'PLN',
    timezone: 'Europe/Warsaw',
    distanceUnit: 'KM',
    fuelUnit: 'L',
    dateFormat: 'DD_MM_YYYY',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInvite = {
    id: 'invite-123',
    workspaceId: 'workspace-123',
    email: 'invite@example.com',
    role: Role.MEMBER,
    status: InviteStatus.PENDING,
    token: 'token-123',
    expiresAt: new Date(),
    invitedById: 'user-123',
    acceptedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: WorkspacesRepo,
          useValue: {
            findById: jest.fn(),
            findByIdWithOwner: jest.fn(),
            findAllByUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: WorkspaceMembersRepo,
          useValue: {
            findByWorkspaceAndUser: jest.fn(),
            findAllByWorkspaceId: jest.fn(),
            findById: jest.fn(),
            findByIdWithUser: jest.fn(),
            countByWorkspaceId: jest.fn(),
            create: jest.fn(),
            updateRole: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: WorkspaceSettingsRepo,
          useValue: {
            findByWorkspaceId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: WorkspaceInvitesRepo,
          useValue: {
            findPendingByWorkspaceAndEmail: jest.fn(),
            findByToken: jest.fn(),
            create: jest.fn(),
            updateStatus: jest.fn(),
            deleteAllByWorkspaceId: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            getById: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: VehiclesService,
          useValue: {
            softDeleteAllByWorkspaceId: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendWorkspaceInvite: jest.fn(),
            sendRemovedFromWorkspace: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            frontendUrl: 'https://example.com',
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    workspacesRepo = module.get(WorkspacesRepo) as jest.Mocked<WorkspacesRepo>;
    workspaceMembersRepo = module.get(WorkspaceMembersRepo) as jest.Mocked<WorkspaceMembersRepo>;
    workspaceSettingsRepo = module.get(WorkspaceSettingsRepo) as jest.Mocked<WorkspaceSettingsRepo>;
    workspaceInvitesRepo = module.get(WorkspaceInvitesRepo) as jest.Mocked<WorkspaceInvitesRepo>;
    usersService = module.get(UsersService) as jest.Mocked<UsersService>;
    vehiclesService = module.get(VehiclesService) as jest.Mocked<VehiclesService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
    config = module.get(AppConfigService) as jest.Mocked<AppConfigService>;
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ─── Queries ──────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('should return workspace by id', async () => {
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);

      const result = await service.getById('workspace-123');

      expect(result).toEqual(mockWorkspace);
      expect(workspacesRepo.findById).toHaveBeenCalledWith('workspace-123');
    });

    it('should throw NotFoundException if workspace not found', async () => {
      workspacesRepo.findById.mockResolvedValue(null);

      await expect(service.getById('invalid-id')).rejects.toThrow(NotFoundException);
      expect(workspacesRepo.findById).toHaveBeenCalledWith('invalid-id');
    });
  });

  describe('getAllByUserId', () => {
    it('should return all workspaces for user', async () => {
      const workspaces = [
        {
          ...mockWorkspace,
          members: [{ role: Role.OWNER }],
          _count: { members: 1, vehicles: 2 },
        },
        {
          ...mockWorkspace,
          id: 'ws-2',
          members: [{ role: Role.MEMBER }],
          _count: { members: 1, vehicles: 3 },
        },
      ];
      workspacesRepo.findAllByUserId.mockResolvedValue(workspaces);

      const result = await service.getAllByUserId('user-123');

      expect(result).toHaveLength(2);
      expect(workspacesRepo.findAllByUserId).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array when user has no workspaces', async () => {
      workspacesRepo.findAllByUserId.mockResolvedValue([]);

      const result = await service.getAllByUserId('user-456');

      expect(result).toEqual([]);
    });
  });

  describe('getByIdWithOwner', () => {
    it('should return workspace with owner info and user role', async () => {
      workspacesRepo.findByIdWithOwner.mockResolvedValue({
        ...mockWorkspace,
        owner: mockUser,
        _count: { members: 1, vehicles: 0 },
      } as any);
      workspaceMembersRepo.findByWorkspaceAndUser.mockResolvedValue(mockMember as any);

      const result = await service.getByIdWithOwner('workspace-123', 'user-123');

      expect(result).toBeDefined();
      expect(workspacesRepo.findByIdWithOwner).toHaveBeenCalledWith('workspace-123');
      expect(workspaceMembersRepo.findByWorkspaceAndUser).toHaveBeenCalledWith(
        'workspace-123',
        'user-123',
      );
    });

    it('should throw NotFoundException if workspace not found', async () => {
      workspacesRepo.findByIdWithOwner.mockResolvedValue(null);

      await expect(service.getByIdWithOwner('invalid-id', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      workspacesRepo.findByIdWithOwner.mockResolvedValue(mockWorkspace as any);
      workspaceMembersRepo.findByWorkspaceAndUser.mockResolvedValue(null);

      await expect(service.getByIdWithOwner('workspace-123', 'user-456')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ─── Commands (Workspace) ──────────────────────────────────────────────────

  describe('create', () => {
    it('should create workspace with owner member and settings', async () => {
      const createDto: CreateWorkspaceDto = {
        name: 'New Workspace',
        type: 'PERSONAL',
      };

      prisma.$transaction.mockImplementation((callback) => callback({} as any));
      workspacesRepo.create.mockResolvedValue(mockWorkspace);
      workspaceMembersRepo.create.mockResolvedValue(mockMember as any);
      workspaceSettingsRepo.create.mockResolvedValue(mockSettings as any);

      const result = await service.create('user-123', createDto);

      expect(result.id).toBe('workspace-123');
      expect(workspacesRepo.create).toHaveBeenCalled();
      expect(workspaceMembersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace-123',
          userId: 'user-123',
          role: Role.OWNER,
        }),
        expect.anything(),
      );
      expect(workspaceSettingsRepo.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update workspace if user is owner or admin', async () => {
      const updateDto: UpdateWorkspaceDto = { name: 'Updated Name' };
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceMembersRepo.findByWorkspaceAndUser.mockResolvedValue({
        ...mockMember,
        role: Role.OWNER,
      } as any);
      workspacesRepo.update.mockResolvedValue({
        ...mockWorkspace,
        name: 'Updated Name',
      });

      const result = await service.update('workspace-123', updateDto, 'user-123');

      expect(result.id).toBe('workspace-123');
      expect(workspacesRepo.update).toHaveBeenCalledWith('workspace-123', updateDto);
    });

    it('should throw ForbiddenException if user is member', async () => {
      const updateDto: UpdateWorkspaceDto = { name: 'Updated Name' };
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceMembersRepo.findByWorkspaceAndUser.mockResolvedValue({
        ...mockMember,
        role: Role.MEMBER,
      } as any);

      await expect(service.update('workspace-123', updateDto, 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user is not member', async () => {
      const updateDto: UpdateWorkspaceDto = { name: 'Updated Name' };
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceMembersRepo.findByWorkspaceAndUser.mockResolvedValue(null);

      await expect(service.update('workspace-123', updateDto, 'user-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('delete', () => {
    it('should delete workspace if user is owner and no other members', async () => {
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceMembersRepo.countByWorkspaceId.mockResolvedValue(1);
      prisma.$transaction.mockImplementation((callback) => callback({} as any));

      await service.delete('workspace-123', 'user-123');

      expect(vehiclesService.softDeleteAllByWorkspaceId).toHaveBeenCalledWith(
        'workspace-123',
        expect.anything(),
      );
      expect(workspaceInvitesRepo.deleteAllByWorkspaceId).toHaveBeenCalledWith(
        'workspace-123',
        expect.anything(),
      );
      expect(workspacesRepo.softDelete).toHaveBeenCalledWith('workspace-123', expect.anything());
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      workspacesRepo.findById.mockResolvedValue({
        ...mockWorkspace,
        ownerId: 'other-user',
      });

      await expect(service.delete('workspace-123', 'user-123')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if workspace has other members', async () => {
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceMembersRepo.countByWorkspaceId.mockResolvedValue(2);

      await expect(service.delete('workspace-123', 'user-123')).rejects.toThrow(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ─── Settings ──────────────────────────────────────────────────────────────

  describe('getSettings', () => {
    it('should return workspace settings', async () => {
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceSettingsRepo.findByWorkspaceId.mockResolvedValue(mockSettings as any);

      const result = await service.getSettings('workspace-123');

      expect(result).toBeDefined();
      expect(workspaceSettingsRepo.findByWorkspaceId).toHaveBeenCalledWith('workspace-123');
    });

    it('should throw NotFoundException if workspace not found', async () => {
      workspacesRepo.findById.mockResolvedValue(null);

      await expect(service.getSettings('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if settings not found', async () => {
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceSettingsRepo.findByWorkspaceId.mockResolvedValue(null);

      await expect(service.getSettings('workspace-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSettings', () => {
    it('should update workspace settings', async () => {
      const updateDto: UpdateWorkspaceSettingsDto = {
        currency: 'USD',
        timezone: 'America/New_York',
      };
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceSettingsRepo.update.mockResolvedValue({
        ...mockSettings,
        ...updateDto,
      } as any);

      const result = await service.updateSettings('workspace-123', updateDto);

      expect(result).toBeDefined();
      expect(workspaceSettingsRepo.update).toHaveBeenCalledWith('workspace-123', updateDto);
    });
  });

  // ─── Members ───────────────────────────────────────────────────────────────

  describe('getMembers', () => {
    it('should return all workspace members', async () => {
      const members = [mockMember, { ...mockMember, id: 'member-2', role: Role.ADMIN }];
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceMembersRepo.findAllByWorkspaceId.mockResolvedValue(members as any);

      const result = await service.getMembers('workspace-123');

      expect(result).toHaveLength(2);
      expect(workspaceMembersRepo.findAllByWorkspaceId).toHaveBeenCalledWith('workspace-123');
    });

    it('should throw NotFoundException if workspace not found', async () => {
      workspacesRepo.findById.mockResolvedValue(null);

      await expect(service.getMembers('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role if acting member is owner', async () => {
      const updateDto: UpdateMemberRoleDto = { role: Role.ADMIN };
      const actingMember = { ...mockMember, role: Role.OWNER };
      const targetMember = { ...mockMember, id: 'member-2', role: Role.MEMBER };

      workspaceMembersRepo.findById.mockResolvedValue(targetMember as any);
      workspaceMembersRepo.updateRole.mockResolvedValue({
        ...targetMember,
        role: Role.ADMIN,
      } as any);
      workspaceMembersRepo.findByIdWithUser.mockResolvedValue({
        ...targetMember,
        role: Role.ADMIN,
        user: mockUser,
      } as any);

      const result = await service.updateMemberRole(
        'workspace-123',
        'member-2',
        updateDto,
        actingMember as any,
      );

      expect(result).toBeDefined();
      expect(workspaceMembersRepo.updateRole).toHaveBeenCalledWith('member-2', Role.ADMIN);
    });

    it('should throw ForbiddenException if trying to change owner role', async () => {
      const updateDto: UpdateMemberRoleDto = { role: Role.MEMBER };
      const actingMember = { ...mockMember, role: Role.OWNER };

      workspaceMembersRepo.findById.mockResolvedValue({
        ...mockMember,
        role: Role.OWNER,
      } as any);

      await expect(
        service.updateMemberRole('workspace-123', 'member-123', updateDto, actingMember as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if admin tries to make someone owner', async () => {
      const updateDto: UpdateMemberRoleDto = { role: Role.OWNER };
      const actingMember = { ...mockMember, role: Role.ADMIN };
      const targetMember = { ...mockMember, id: 'member-2', role: Role.MEMBER };

      workspaceMembersRepo.findById.mockResolvedValue(targetMember as any);

      await expect(
        service.updateMemberRole('workspace-123', 'member-2', updateDto, actingMember as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeMember', () => {
    it('should remove member if not owner', async () => {
      const actingMember = { ...mockMember, role: Role.OWNER };
      const targetMember = { ...mockMember, id: 'member-2', role: Role.MEMBER };

      workspaceMembersRepo.findById.mockResolvedValue(targetMember as any);
      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      usersService.getById.mockResolvedValue(mockUser as any);

      await service.removeMember('workspace-123', 'member-2', actingMember as any);

      expect(workspaceMembersRepo.delete).toHaveBeenCalledWith('member-2');
      expect(mailService.sendRemovedFromWorkspace).toHaveBeenCalledWith({
        to: mockUser.email,
        firstName: mockUser.firstName,
        workspaceName: mockWorkspace.name,
      });
    });

    it('should throw ForbiddenException if trying to remove owner', async () => {
      const actingMember = { ...mockMember, role: Role.OWNER };

      workspaceMembersRepo.findById.mockResolvedValue(mockMember as any);

      await expect(
        service.removeMember('workspace-123', 'member-123', actingMember as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if admin tries to remove admin', async () => {
      const actingMember = { ...mockMember, id: 'member-1', role: Role.ADMIN };
      const targetMember = { ...mockMember, id: 'member-2', role: Role.ADMIN };

      workspaceMembersRepo.findById.mockResolvedValue(targetMember as any);

      await expect(
        service.removeMember('workspace-123', 'member-2', actingMember as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('leaveWorkspace', () => {
    it('should allow member to leave workspace', async () => {
      const actingMember = { ...mockMember, role: Role.ADMIN };

      workspaceMembersRepo.findByWorkspaceAndUser.mockResolvedValue(mockMember as any);

      await service.leaveWorkspace('workspace-123', 'user-123', actingMember as any);

      expect(workspaceMembersRepo.delete).toHaveBeenCalledWith('member-123');
    });

    it('should throw ForbiddenException if owner tries to leave', async () => {
      const actingMember = { ...mockMember, role: Role.OWNER };

      await expect(
        service.leaveWorkspace('workspace-123', 'user-123', actingMember as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if member not found', async () => {
      const actingMember = { ...mockMember, role: Role.ADMIN };

      workspaceMembersRepo.findByWorkspaceAndUser.mockResolvedValue(null);

      await expect(
        service.leaveWorkspace('workspace-123', 'user-456', actingMember as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── Invites ───────────────────────────────────────────────────────────────

  describe('createInvite', () => {
    it('should create workspace invite and send email', async () => {
      const createDto: CreateInviteDto = { email: 'invite@example.com', role: Role.ADMIN };

      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceInvitesRepo.findPendingByWorkspaceAndEmail.mockResolvedValue(null);
      workspaceInvitesRepo.create.mockResolvedValue(mockInvite as any);
      usersService.getById.mockResolvedValue(mockUser as any);
      usersService.findByEmail.mockResolvedValue(null);
      mailService.sendWorkspaceInvite.mockResolvedValue(undefined);

      const result = await service.createInvite('workspace-123', 'user-123', createDto);

      expect(result).toBeDefined();
      expect(workspaceInvitesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: 'workspace-123',
          email: 'invite@example.com',
          role: Role.ADMIN,
        }),
      );
      expect(mailService.sendWorkspaceInvite).toHaveBeenCalled();
    });

    it('should throw ConflictException if invite already pending', async () => {
      const createDto: CreateInviteDto = { email: 'invite@example.com' };

      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceInvitesRepo.findPendingByWorkspaceAndEmail.mockResolvedValue(mockInvite as any);

      await expect(service.createInvite('workspace-123', 'user-123', createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should use default MEMBER role if not specified', async () => {
      const createDto: CreateInviteDto = { email: 'invite@example.com' };

      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceInvitesRepo.findPendingByWorkspaceAndEmail.mockResolvedValue(null);
      workspaceInvitesRepo.create.mockResolvedValue(mockInvite as any);
      usersService.getById.mockResolvedValue(mockUser as any);
      usersService.findByEmail.mockResolvedValue(null);
      mailService.sendWorkspaceInvite.mockResolvedValue(undefined);

      await service.createInvite('workspace-123', 'user-123', createDto);

      expect(workspaceInvitesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.MEMBER }),
      );
    });

    it('should set invite expiration to 7 days', async () => {
      const createDto: CreateInviteDto = { email: 'invite@example.com' };
      const now = Date.now();

      workspacesRepo.findById.mockResolvedValue(mockWorkspace);
      workspaceInvitesRepo.findPendingByWorkspaceAndEmail.mockResolvedValue(null);
      workspaceInvitesRepo.create.mockResolvedValue(mockInvite as any);
      usersService.getById.mockResolvedValue(mockUser as any);
      usersService.findByEmail.mockResolvedValue(null);
      mailService.sendWorkspaceInvite.mockResolvedValue(undefined);

      await service.createInvite('workspace-123', 'user-123', createDto);

      const call = workspaceInvitesRepo.create.mock.calls[0][0];
      const expiresIn = call.expiresAt.getTime() - now;
      expect(expiresIn).toBeLessThanOrEqual(7 * TIME_UNITS.MILLISECONDS_PER_DAY + 1000);
      expect(expiresIn).toBeGreaterThan(7 * TIME_UNITS.MILLISECONDS_PER_DAY - 1000);
    });
  });
});

import { MilestonesCron } from './milestones.cron';
import { MilestonesService } from './milestones.service';

describe('MilestonesCron', () => {
  let cron: MilestonesCron;
  let milestonesService: jest.Mocked<MilestonesService>;

  beforeEach(() => {
    milestonesService = {
      checkOwnershipMilestones: jest.fn(),
    } as unknown as jest.Mocked<MilestonesService>;

    cron = new MilestonesCron(milestonesService);
    jest.spyOn(cron['logger'], 'log').mockImplementation(() => undefined);
    jest.spyOn(cron['logger'], 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handleOwnershipMilestones: викликає сервіс і логує успіх', async () => {
    milestonesService.checkOwnershipMilestones.mockResolvedValue(undefined);

    await cron.handleOwnershipMilestones();

    expect(milestonesService.checkOwnershipMilestones).toHaveBeenCalledTimes(1);
    expect(cron['logger'].log).toHaveBeenCalledWith('⏰ Running ownership milestones cron...');
    expect(cron['logger'].log).toHaveBeenCalledWith('✅ Ownership milestones cron completed');
    expect(cron['logger'].error).not.toHaveBeenCalled();
  });

  it('handleOwnershipMilestones: не кидає помилку і логує failure', async () => {
    const error = new Error('DB failure');
    milestonesService.checkOwnershipMilestones.mockRejectedValue(error);

    await expect(cron.handleOwnershipMilestones()).resolves.toBeUndefined();

    expect(cron['logger'].error).toHaveBeenCalledWith(
      '❌ Ownership milestones cron failed: DB failure',
      error.stack,
    );
  });
});

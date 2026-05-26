import { WorkspaceResponseDto } from './workspace-response.dto';

export class WorkspaceWithOwnerResponseDto extends WorkspaceResponseDto {
  declare owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

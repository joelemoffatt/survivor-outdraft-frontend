import apiService, { GroupMemberResponse, UserRecord } from '../../services/api';
import { GenericCrudConfig } from './genericCrudTypes';

export type SocialResourceKey = 'users' | 'groups' | 'group-members' | 'teams' | 'team-castaways';

export interface SocialObjectSpec {
  key: SocialResourceKey;
  label: string;
  description: string;
  tableEndpoint: string;
  itemEndpoint?: string;
  createEndpoint?: string;
  updateEndpoint?: string;
  deleteEndpoint?: string;
  fields: string[];
  relationships: string[];
  listConnections: string[];
  crudReady: boolean;
  notes?: string[];
}

export const socialObjectSpecs: SocialObjectSpec[] = [
  {
    key: 'users',
    label: 'Users',
    description: 'Platform user identities and role assignment.',
    tableEndpoint: '/v1/users',
    itemEndpoint: '/v1/users/{id}',
    createEndpoint: '/v1/users',
    updateEndpoint: '/v1/users',
    deleteEndpoint: '/v1/users/{id}',
    fields: ['id', 'username', 'email', 'role', 'enabled', 'createdAt'],
    relationships: ['Admin of Group (Group.admin)', 'Member via GroupMember.user', 'Owner via Team.user'],
    listConnections: ['/v1/users', '/v1/groups/admin/{adminId}', '/v1/group-members/user/{userId}', '/v1/teams/user/{userId}'],
    crudReady: true,
  },
  {
    key: 'groups',
    label: 'Groups',
    description: 'Season-specific draft group container with scoring settings.',
    tableEndpoint: '/v1/groups',
    itemEndpoint: '/v1/groups/{id}',
    createEndpoint: '/v1/groups',
    updateEndpoint: '/v1/groups/{id}/settings (PATCH)',
    deleteEndpoint: '/v1/groups/{id}',
    fields: ['id', 'name', 'admin', 'season', 'teamSize', 'firstScoringEpisodeNumber', 'latestEpisodeWatched', 'status', 'draft', 'pointRules', 'createdAt'],
    relationships: ['ManyToOne admin -> User', 'ManyToOne season -> Season', 'ManyToOne latestEpisodeWatched -> Episode', 'OneToMany members -> GroupMember[]', 'OneToMany teams -> Team[]', 'OneToMany pointRules -> PointRule[]'],
    listConnections: ['/v1/groups', '/v1/groups/admin/{adminId}', '/v1/groups/user/{userId}', '/v1/groups/season/{seasonId}'],
    crudReady: true,
    notes: ['Create requires nested refs and pointRules list.', 'Update uses PATCH settings contract, not generic PUT entity.'],
  },
  {
    key: 'group-members',
    label: 'Group Members',
    description: 'Membership join entity between user and group with invite status.',
    tableEndpoint: '/v1/group-members',
    itemEndpoint: '/v1/group-members/{id}',
    createEndpoint: '/v1/group-members (or /v1/group-members/invite-by-username)',
    updateEndpoint: '/v1/group-members/{id}/status (PATCH with query param)',
    deleteEndpoint: '/v1/group-members/{id}',
    fields: ['id', 'group', 'user', 'status', 'joinedAt', 'lastAccessedAt'],
    relationships: ['ManyToOne group -> Group', 'ManyToOne user -> User'],
    listConnections: ['/v1/group-members', '/v1/group-members/group/{groupId}', '/v1/group-members/user/{userId}', '/v1/group-members/user/{userId}/pending'],
    crudReady: true,
    notes: ['Status transitions use specialized endpoint/query param.', 'Invite-by-username flow is separate from raw POST.'],
  },
  {
    key: 'teams',
    label: 'Teams',
    description: 'Team container per (group,user) with roster and points.',
    tableEndpoint: '/v1/teams',
    itemEndpoint: '/v1/teams/{id}',
    createEndpoint: '/v1/teams',
    updateEndpoint: '/v1/teams (PUT)',
    deleteEndpoint: '/v1/teams/{id}',
    fields: ['id', 'teamName', 'totalPoints', 'createdAt', 'roster'],
    relationships: ['ManyToOne group -> Group', 'ManyToOne user -> User', 'OneToMany roster -> TeamCastaway[]'],
    listConnections: ['/v1/teams', '/v1/teams/group/{groupId}', '/v1/teams/user/{userId}', '/v1/teams/group/{groupId}/user/{userId}'],
    crudReady: false,
    notes: ['DTO omits direct group/user IDs in list payload, so generic form mapping needs custom adapters.'],
  },
  {
    key: 'team-castaways',
    label: 'Team Castaways',
    description: 'Join entity connecting drafted castaway performance records to teams.',
    tableEndpoint: '/v1/team-castaways',
    itemEndpoint: '/v1/team-castaways/{id}',
    createEndpoint: '/v1/team-castaways',
    updateEndpoint: '/v1/team-castaways (PUT)',
    deleteEndpoint: '/v1/team-castaways/{id}',
    fields: ['id', 'team', 'castawayPerformance', 'draftOrder', 'points', 'draftedAt'],
    relationships: ['ManyToOne team -> Team', 'ManyToOne castawayPerformance -> CastawayPerformance'],
    listConnections: ['/v1/team-castaways', '/v1/team-castaways/team/{teamId}'],
    crudReady: false,
    notes: ['Create/update expects nested relation payloads for team and castawayPerformance.'],
  },
];

export const userCrudConfig: GenericCrudConfig<UserRecord> = {
  title: 'Admin Social',
  subtitle: 'User management',
  entityName: 'User',
  idKey: 'id',
  initialFormValues: {
    role: 'USER',
    enabled: true,
  },
  endpoints: {
    list: '/v1/users',
    getById: '/v1/users',
    create: '/v1/users',
    update: '/v1/users',
    remove: '/v1/users',
  },
  fields: [
    {
      key: 'username',
      label: 'Username',
      type: 'text',
      required: true,
      placeholder: 'Enter username',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      placeholder: 'Enter email',
    },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { label: 'User', value: 'USER' },
        { label: 'Admin', value: 'ADMIN' },
      ],
    },
    {
      key: 'enabled',
      label: 'Enabled',
      type: 'boolean',
    },
  ],
  toCreatePayload: (values) => ({
    username: String(values.username ?? '').trim(),
    email: String(values.email ?? '').trim(),
    role: values.role === 'ADMIN' ? 'ADMIN' : 'USER',
    enabled: Boolean(values.enabled),
  }),
  toUpdatePayload: (item, values) => ({
    id: item.id,
    username: String(values.username ?? '').trim(),
    email: String(values.email ?? '').trim(),
    role: values.role === 'ADMIN' ? 'ADMIN' : 'USER',
    enabled: Boolean(values.enabled),
  }),
  fromItemToForm: (item) => ({
    username: item.username,
    email: item.email,
    role: item.role,
    enabled: item.enabled,
  }),
  tableColumns: [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'enabled',
      label: 'Enabled',
      render: (item) => (item.enabled ? 'True' : 'False'),
    },
    { key: 'createdAt', label: 'Created At' },
  ],
};

export const socialCrudConfigMap: Partial<Record<SocialResourceKey, GenericCrudConfig<any>>> = {
  users: userCrudConfig,
  groups: {
    title: 'Admin Social',
    subtitle: 'Group setup and settings',
    entityName: 'Group',
    idKey: 'id',
    initialFormValues: {
      teamSize: 2,
      firstScoringEpisodeNumber: 1,
      style: 'SNAKE',
    },
    endpoints: {
      list: '/v1/groups',
      getById: '/v1/groups',
      create: '/v1/groups',
      update: '/v1/groups',
      remove: '/v1/groups',
    },
    fields: [
      {
        key: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        placeholder: 'Enter group name',
      },
      {
        key: 'adminId',
        label: 'Admin',
        type: 'association',
        required: true,
        createOnly: true,
        placeholder: 'Select admin user',
        association: {
          endpoint: '/v1/users',
          valuePath: 'id',
          labelPath: 'username',
        },
      },
      {
        key: 'seasonId',
        label: 'Season',
        type: 'association',
        required: true,
        placeholder: 'Select season',
        association: {
          endpoint: '/v1/seasons',
          valuePath: 'season',
          labelPath: 'seasonName',
        },
      },
      {
        key: 'teamSize',
        label: 'Team Size',
        type: 'number',
        required: true,
      },
      {
        key: 'firstScoringEpisodeNumber',
        label: 'First Scoring Episode #',
        type: 'number',
        required: true,
      },
      {
        key: 'latestWatchedEpisodeId',
        label: 'Latest Watched Episode',
        type: 'association',
        placeholder: 'Optional',
        association: {
          endpoint: '/v1/episodes',
          valuePath: 'id',
          labelPath: 'episodeTitle',
        },
      },
      {
        key: 'style',
        label: 'Draft Style',
        type: 'select',
        required: true,
        options: [
          { label: 'Snake', value: 'SNAKE' },
          { label: 'Round Robin', value: 'ROUND_ROBIN' },
          { label: 'Linear', value: 'LINEAR' },
        ],
      },
    ],
    customCreate: async (values) => {
      const name = String(values.name ?? '').trim();
      const adminId = Number(values.adminId);
      const seasonId = Number(values.seasonId);
      const teamSize = Number(values.teamSize);
      const firstScoringEpisodeNumber = Number(values.firstScoringEpisodeNumber ?? 1);
      const latestWatchedEpisodeId = Number(values.latestWatchedEpisodeId);
      const style = String(values.style ?? 'SNAKE');

      if (!name) {
        throw new Error('Group name is required.');
      }
      if (Number.isNaN(adminId) || adminId <= 0) {
        throw new Error('Valid Admin ID is required.');
      }
      if (Number.isNaN(seasonId) || seasonId <= 0) {
        throw new Error('Valid Season ID is required.');
      }
      if (Number.isNaN(teamSize) || teamSize <= 0) {
        throw new Error('Team Size must be greater than 0.');
      }

      const payload: Record<string, any> = {
        name,
        admin: { id: adminId },
        season: { id: seasonId },
        teamSize,
        firstScoringEpisodeNumber: Number.isNaN(firstScoringEpisodeNumber) ? 1 : firstScoringEpisodeNumber,
        style,
        pointRules: [],
      };

      if (!Number.isNaN(latestWatchedEpisodeId) && latestWatchedEpisodeId > 0) {
        payload.latestWatchedEpisode = { id: latestWatchedEpisodeId };
      }

      await apiService.post('/v1/groups', payload);
    },
    customUpdate: async (item, values) => {
      const name = String(values.name ?? '').trim();
      const seasonId = Number(values.seasonId);
      const teamSize = Number(values.teamSize);
      const firstScoringEpisodeNumber = Number(values.firstScoringEpisodeNumber ?? 1);
      const latestWatchedEpisodeId = Number(values.latestWatchedEpisodeId);
      const style = String(values.style ?? 'SNAKE');

      if (!name) {
        throw new Error('Group name is required.');
      }
      if (Number.isNaN(seasonId) || seasonId <= 0) {
        throw new Error('Valid Season ID is required.');
      }
      if (Number.isNaN(teamSize) || teamSize <= 0) {
        throw new Error('Team Size must be greater than 0.');
      }

      await apiService.patch(`/v1/groups/${item.id}/settings`, {
        name,
        seasonId,
        teamSize,
        firstScoringEpisodeNumber: Number.isNaN(firstScoringEpisodeNumber) ? 1 : firstScoringEpisodeNumber,
        latestWatchedEpisodeId:
          Number.isNaN(latestWatchedEpisodeId) || latestWatchedEpisodeId <= 0
            ? null
            : latestWatchedEpisodeId,
        style,
      });
    },
    fromItemToForm: (item) => ({
      name: item.name,
      adminId: item.admin?.id ?? '',
      seasonId: item.season?.id ?? '',
      teamSize: item.teamSize ?? '',
      firstScoringEpisodeNumber: item.firstScoringEpisodeNumber ?? 1,
      latestWatchedEpisodeId: item.latestEpisodeWatched?.id ?? '',
      style: item.draft?.style ?? 'SNAKE',
    }),
    tableColumns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'admin', label: 'Admin', render: (item) => item.admin?.username ?? '' },
      { key: 'season', label: 'Season', render: (item) => item.season?.seasonName ?? '' },
      { key: 'teamSize', label: 'Team Size', render: (item) => String(item.teamSize ?? '') },
      {
        key: 'firstScoringEpisodeNumber',
        label: 'First Scoring Ep',
        render: (item) => String(item.firstScoringEpisodeNumber ?? ''),
      },
      {
        key: 'latestEpisodeWatched',
        label: 'Latest Watched Ep',
        render: (item) => String(item.latestEpisodeWatched?.episodeNumber ?? ''),
      },
      { key: 'status', label: 'Status', render: (item) => String(item.status ?? '') },
      { key: 'createdAt', label: 'Created At', render: (item) => String(item.createdAt ?? '') },
    ],
  },
  'group-members': {
    title: 'Admin Social',
    subtitle: 'Group membership and invitation status',
    entityName: 'Group Member',
    idKey: 'id',
    endpoints: {
      list: '/v1/group-members',
      getById: '/v1/group-members',
      create: '/v1/group-members/invite-by-username',
      update: '/v1/group-members',
      remove: '/v1/group-members',
    },
    fields: [
      {
        key: 'groupId',
        label: 'Group',
        type: 'association',
        required: true,
        createOnly: true,
        placeholder: 'Select target group',
        association: {
          endpoint: '/v1/groups',
          valuePath: 'id',
          labelPath: 'name',
        },
      },
      {
        key: 'username',
        label: 'Username',
        type: 'association',
        required: true,
        createOnly: true,
        placeholder: 'Select username to invite',
        association: {
          endpoint: '/v1/users',
          valuePath: 'username',
          labelPath: 'username',
        },
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        updateOnly: true,
        options: [
          { label: 'Invited', value: 'INVITED' },
          { label: 'Accepted', value: 'ACCEPTED' },
          { label: 'Declined', value: 'DECLINED' },
        ],
      },
    ],
    customCreate: async (values) => {
      const groupId = Number(values.groupId);
      if (Number.isNaN(groupId) || groupId <= 0) {
        throw new Error('Valid Group ID is required.');
      }

      const username = String(values.username ?? '').trim();
      if (!username) {
        throw new Error('Username is required.');
      }

      await apiService.post('/v1/group-members/invite-by-username', {
        groupId,
        username,
      });
    },
    customUpdate: async (item: GroupMemberResponse, values) => {
      const status = String(values.status ?? '').trim();
      if (!status) {
        throw new Error('Status is required.');
      }

      await apiService.patch(`/v1/group-members/${item.id}/status?status=${encodeURIComponent(status)}`, {});
    },
    fromItemToForm: (item: GroupMemberResponse) => ({
      groupId: item.group?.id ?? '',
      username: item.user?.username ?? '',
      status: item.status,
    }),
    tableColumns: [
      { key: 'id', label: 'ID' },
      { key: 'groupName', label: 'Group', render: (item: GroupMemberResponse) => item.group?.name ?? '' },
      { key: 'username', label: 'Username', render: (item: GroupMemberResponse) => item.user?.username ?? '' },
      { key: 'email', label: 'Email', render: (item: GroupMemberResponse) => item.user?.email ?? '' },
      { key: 'status', label: 'Status', render: (item: GroupMemberResponse) => item.status },
      { key: 'joinedAt', label: 'Joined At', render: (item: GroupMemberResponse) => item.joinedAt ?? '' },
      { key: 'lastAccessedAt', label: 'Last Accessed', render: (item: GroupMemberResponse) => item.lastAccessedAt ?? '' },
    ],
  },
};

export const getSocialObjectSpec = (resource: string) =>
  socialObjectSpecs.find((item) => item.key === resource);

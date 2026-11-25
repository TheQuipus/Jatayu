import { DataTypes } from 'sequelize';
import adminDb from '../config/db/admin.js';

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch {
    return false;
  }
}

async function indexNames(queryInterface, tableName) {
  try {
    return new Set((await queryInterface.showIndex(tableName)).map((index) => index.name));
  } catch {
    return new Set();
  }
}

async function ensureSupportTicketsTable(queryInterface) {
  const exists = await tableExists(queryInterface, 'SupportTickets');

  if (!exists) {
    await queryInterface.createTable('SupportTickets', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      ticketNumber: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      requesterType: {
        type: DataTypes.ENUM('seeker', 'expert'),
        allowNull: false,
      },
      requesterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      requesterName: {
        type: DataTypes.STRING(180),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(254),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING(180),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(160),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('open', 'replied'),
        allowNull: false,
        defaultValue: 'open',
      },
      adminNotifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      lastRepliedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
    console.log('[Support Tickets] Created table: SupportTickets');
  } else {
    const columns = await queryInterface.describeTable('SupportTickets');
    const additions = {
      ticketNumber: { type: DataTypes.STRING(32), allowNull: false },
      requesterType: { type: DataTypes.ENUM('seeker', 'expert'), allowNull: false },
      requesterId: { type: DataTypes.UUID, allowNull: false },
      requesterName: { type: DataTypes.STRING(180), allowNull: false },
      email: { type: DataTypes.STRING(254), allowNull: false },
      phone: { type: DataTypes.STRING(32), allowNull: false },
      subject: { type: DataTypes.STRING(180), allowNull: false },
      description: { type: DataTypes.STRING(160), allowNull: false },
      status: { type: DataTypes.ENUM('open', 'replied'), allowNull: false, defaultValue: 'open' },
      adminNotifiedAt: { type: DataTypes.DATE, allowNull: true },
      lastRepliedAt: { type: DataTypes.DATE, allowNull: true },
    };

    for (const [column, definition] of Object.entries(additions)) {
      if (!columns[column]) {
        await queryInterface.addColumn('SupportTickets', column, definition);
        console.log(`[Support Tickets] Added column SupportTickets.${column}`);
      }
    }
  }

  const indexes = await indexNames(queryInterface, 'SupportTickets');

  if (!indexes.has('support_tickets_ticket_number_unique') && !indexes.has('ticketNumber')) {
    await queryInterface.addIndex('SupportTickets', ['ticketNumber'], {
      name: 'support_tickets_ticket_number_unique',
      unique: true,
    });
    console.log('[Support Tickets] Added unique index: support_tickets_ticket_number_unique');
  }

  if (!indexes.has('support_tickets_requester_created')) {
    await queryInterface.addIndex('SupportTickets', ['requesterType', 'requesterId', 'createdAt'], {
      name: 'support_tickets_requester_created',
    });
    console.log('[Support Tickets] Added index: support_tickets_requester_created');
  }

  if (!indexes.has('support_tickets_status_created')) {
    await queryInterface.addIndex('SupportTickets', ['status', 'createdAt'], {
      name: 'support_tickets_status_created',
    });
    console.log('[Support Tickets] Added index: support_tickets_status_created');
  }
}

async function ensureSupportRepliesTable(queryInterface) {
  const exists = await tableExists(queryInterface, 'SupportReplies');

  if (!exists) {
    await queryInterface.createTable('SupportReplies', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      ticketId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'SupportTickets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      adminId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      adminName: {
        type: DataTypes.STRING(180),
        allowNull: true,
      },
      fromEmail: {
        type: DataTypes.STRING(254),
        allowNull: false,
      },
      toEmail: {
        type: DataTypes.STRING(254),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });
    console.log('[Support Tickets] Created table: SupportReplies');
  } else {
    const columns = await queryInterface.describeTable('SupportReplies');
    const additions = {
      ticketId: { type: DataTypes.UUID, allowNull: false },
      adminId: { type: DataTypes.UUID, allowNull: true },
      adminName: { type: DataTypes.STRING(180), allowNull: true },
      fromEmail: { type: DataTypes.STRING(254), allowNull: false },
      toEmail: { type: DataTypes.STRING(254), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
    };

    for (const [column, definition] of Object.entries(additions)) {
      if (!columns[column]) {
        await queryInterface.addColumn('SupportReplies', column, definition);
        console.log(`[Support Tickets] Added column SupportReplies.${column}`);
      }
    }
  }

  const indexes = await indexNames(queryInterface, 'SupportReplies');

  if (!indexes.has('support_replies_ticket_created')) {
    await queryInterface.addIndex('SupportReplies', ['ticketId', 'createdAt'], {
      name: 'support_replies_ticket_created',
    });
    console.log('[Support Tickets] Added index: support_replies_ticket_created');
  }
}

async function migrate() {
  await adminDb.authenticate();
  const queryInterface = adminDb.getQueryInterface();

  await ensureSupportTicketsTable(queryInterface);
  await ensureSupportRepliesTable(queryInterface);

  console.log('SupportTickets and SupportReplies tables migrated successfully.');
}

migrate()
  .catch((error) => {
    console.error('Support tickets migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => adminDb.close());

import { pathToFileURL } from 'node:url';
import { DataTypes } from 'sequelize';
import adminDb from '../config/db/admin.js';

async function indexNames(queryInterface, tableName) {
  try {
    return new Set((await queryInterface.showIndex(tableName)).map((index) => index.name));
  } catch {
    return new Set();
  }
}

export async function migrateSupportTicketsConversation(db = adminDb) {
  const queryInterface = db.getQueryInterface();
  const dialect = db.getDialect();

  // 1. SupportTickets columns
  const ticketColumns = await queryInterface.describeTable('SupportTickets');

  if (!ticketColumns.lastReplyBy) {
    await queryInterface.addColumn('SupportTickets', 'lastReplyBy', {
      type: DataTypes.ENUM('requester', 'admin'),
      allowNull: true,
      defaultValue: null,
    });
    console.log('[Support Conversation] Added column SupportTickets.lastReplyBy');
  }

  if (!ticketColumns.closedAt) {
    await queryInterface.addColumn('SupportTickets', 'closedAt', {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    });
    console.log('[Support Conversation] Added column SupportTickets.closedAt');
  }

  if (!ticketColumns.closedByAdminId) {
    await queryInterface.addColumn('SupportTickets', 'closedByAdminId', {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
    });
    console.log('[Support Conversation] Added column SupportTickets.closedByAdminId');
  }

  // 2. Non-destructive status ENUM transition: ('open','replied') -> ('open','replied','closed') -> backfill -> ('open','closed')
  const statusType = String(ticketColumns.status?.type || '').toLowerCase();
  const hasRepliedInEnum = statusType.includes("'replied'") || statusType.includes('replied');
  const hasClosedInEnum = statusType.includes("'closed'") || statusType.includes('closed');

  if (dialect === 'mysql' || dialect === 'mariadb') {
    if (hasRepliedInEnum && !hasClosedInEnum) {
      await db.query(
        "ALTER TABLE `SupportTickets` MODIFY COLUMN `status` ENUM('open', 'replied', 'closed') NOT NULL DEFAULT 'open'",
      );
      console.log("[Support Conversation] Extended SupportTickets.status ENUM to ('open','replied','closed')");
    }

    // Backfill old 'replied' -> status 'open', lastReplyBy 'admin'
    await db.query(
      "UPDATE `SupportTickets` SET `status` = 'open', `lastReplyBy` = COALESCE(`lastReplyBy`, 'admin') WHERE `status` = 'replied'",
    );

    if (hasRepliedInEnum) {
      const [remainingRows] = await db.query(
        "SELECT COUNT(*) AS cnt FROM `SupportTickets` WHERE `status` = 'replied'",
      );
      const remaining = Number(remainingRows?.[0]?.cnt || 0);
      if (remaining === 0) {
        await db.query(
          "ALTER TABLE `SupportTickets` MODIFY COLUMN `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open'",
        );
        console.log("[Support Conversation] Narrowed SupportTickets.status ENUM to ('open','closed')");
      }
    }
  } else {
    // Dialect-agnostic backfill for SQLite / test dialects
    await db.query(
      "UPDATE SupportTickets SET status = 'open', lastReplyBy = COALESCE(lastReplyBy, 'admin') WHERE status = 'replied'",
    );
  }

  const ticketIndexes = await indexNames(queryInterface, 'SupportTickets');
  if (!ticketIndexes.has('support_tickets_status_reply_created')) {
    await queryInterface.addIndex('SupportTickets', ['status', 'lastReplyBy', 'createdAt'], {
      name: 'support_tickets_status_reply_created',
    });
    console.log('[Support Conversation] Added index: support_tickets_status_reply_created');
  }

  // 3. SupportReplies columns & nullability
  const replyColumns = await queryInterface.describeTable('SupportReplies');

  if (!replyColumns.authorType) {
    await queryInterface.addColumn('SupportReplies', 'authorType', {
      type: DataTypes.ENUM('admin', 'seeker', 'expert'),
      allowNull: false,
      defaultValue: 'admin',
    });
    console.log('[Support Conversation] Added column SupportReplies.authorType');
  }

  if (!replyColumns.authorId) {
    await queryInterface.addColumn('SupportReplies', 'authorId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    console.log('[Support Conversation] Added column SupportReplies.authorId');
  }

  if (!replyColumns.authorName) {
    await queryInterface.addColumn('SupportReplies', 'authorName', {
      type: DataTypes.STRING(180),
      allowNull: true,
    });
    console.log('[Support Conversation] Added column SupportReplies.authorName');
  }

  if (replyColumns.fromEmail && replyColumns.fromEmail.allowNull === false) {
    await queryInterface.changeColumn('SupportReplies', 'fromEmail', {
      type: DataTypes.STRING(254),
      allowNull: true,
    });
    console.log('[Support Conversation] Made SupportReplies.fromEmail nullable');
  }

  if (replyColumns.toEmail && replyColumns.toEmail.allowNull === false) {
    await queryInterface.changeColumn('SupportReplies', 'toEmail', {
      type: DataTypes.STRING(254),
      allowNull: true,
    });
    console.log('[Support Conversation] Made SupportReplies.toEmail nullable');
  }

  // Backfill existing SupportReplies rows safely
  await db.query(
    "UPDATE SupportReplies SET authorType = COALESCE(authorType, 'admin'), authorId = COALESCE(authorId, adminId), authorName = COALESCE(authorName, adminName, 'Platform Admin') WHERE authorType IS NULL OR authorId IS NULL OR authorName IS NULL",
  );

  const replyIndexes = await indexNames(queryInterface, 'SupportReplies');
  if (!replyIndexes.has('support_replies_ticket_created')) {
    await queryInterface.addIndex('SupportReplies', ['ticketId', 'createdAt'], {
      name: 'support_replies_ticket_created',
    });
    console.log('[Support Conversation] Added index: support_replies_ticket_created');
  }

  console.log('SupportTickets and SupportReplies conversation migration completed.');
}

const isCliRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCliRun) {
  adminDb
    .authenticate()
    .then(() => migrateSupportTicketsConversation(adminDb))
    .catch((error) => {
      console.error('Support conversation migration failed:', error);
      process.exitCode = 1;
    })
    .finally(() => adminDb.close());
}

// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const { Sequelize, Model } = require('sequelize');

class DatabaseModel {
  constructor(connectionStr, maxConnection = 10) {
    const sequelize = new Sequelize(connectionStr, {
      pool: {
        max: maxConnection,
        min: 1,
      },
    });

    class Framework extends Model {}
    Framework.init(
      {
        // `insertedAt` indicates the time this record is inserted into database.
        insertedAt: Sequelize.DATE,
        name: {
          type: Sequelize.STRING(64),
          primaryKey: true,
        },
        namespace: Sequelize.STRING(64),
        jobName: Sequelize.STRING(256),
        userName: Sequelize.STRING(256),
        jobConfig: Sequelize.TEXT,
        executionType: Sequelize.STRING(32),
        creationTime: Sequelize.DATE,
        virtualCluster: Sequelize.STRING(256),
        jobPriority: Sequelize.STRING(256),
        totalGpuNumber: Sequelize.INTEGER,
        totalTaskNumber: Sequelize.INTEGER,
        totalTaskRoleNumber: Sequelize.INTEGER,
        logPathInfix: Sequelize.STRING(256),
        // `submissionTime` indicates the time user submits this job to rest-server.
        // It is generated by rest-server, and will be recorded into database.
        submissionTime: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        // `dockerSecretDef`, `configSecretDef`, and `priorityClassDef` is the definition of job add-ons.
        // They are generated by rest-server and recorded into database by write-merger.
        // These add-ons are created by poller or the short-cut in write-merger.
        dockerSecretDef: Sequelize.TEXT,
        configSecretDef: Sequelize.TEXT,
        priorityClassDef: Sequelize.TEXT,
        retries: Sequelize.INTEGER,
        retryDelayTime: Sequelize.INTEGER,
        platformRetries: Sequelize.INTEGER,
        resourceRetries: Sequelize.INTEGER,
        userRetries: Sequelize.INTEGER,
        completionTime: Sequelize.DATE,
        appExitCode: Sequelize.INTEGER,
        subState: Sequelize.STRING(32),
        state: Sequelize.STRING(32),
        snapshot: Sequelize.TEXT,
        // `requestSynced`` indicates whether the framework request has been synced with the API server.
        // A framework request is not synced by default.
        // When the write merger finds the request in the watched events is the same as the one in database,
        // it will set requestSynced=true.
        requestSynced: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        // `apiServerDeleted` indicates whether the framework is deleted in the API server.
        // When the poller finds a framework is completed, it will delete it from the API server.
        apiServerDeleted: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        // If a job is archived, it will not be shown in the LIST job API by default.
        archived: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        indexes: [
          {
            unique: false,
            fields: ['submissionTime'],
          },
        ],
        modelName: 'framework',
        createdAt: 'insertedAt',
      },
    );

    class FrameworkHistory extends Model {}
    FrameworkHistory.init(
      {
        insertedAt: Sequelize.DATE,
        uid: {
          type: Sequelize.STRING(36),
          primaryKey: true,
        },
        frameworkName: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        attemptIndex: Sequelize.INTEGER,
        historyType: {
          type: Sequelize.STRING(16),
          allowNull: false,
          defaultValue: 'retry',
        },
        snapshot: Sequelize.TEXT,
      },
      {
        sequelize,
        modelName: 'framework_history',
        createdAt: 'insertedAt',
        indexes: [
          {
            unique: false,
            fields: ['frameworkName'],
          },
        ],
        freezeTableName: true,
      },
    );

    class TaskHistory extends Model {}
    TaskHistory.init(
      {
        insertedAt: Sequelize.DATE,
        uid: {
          type: Sequelize.STRING(36),
          primaryKey: true,
        },
        frameworkName: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        attemptIndex: Sequelize.INTEGER,
        taskUid: {
          type: Sequelize.STRING(36),
          allowNull: false,
        },
        taskAttemptIndex: Sequelize.INTEGER,
        podUid: Sequelize.STRING(36),
        historyType: {
          type: Sequelize.STRING(16),
          allowNull: false,
          defaultValue: 'retry',
        },
        snapshot: Sequelize.TEXT,
      },
      {
        sequelize,
        modelName: 'task_history',
        createdAt: 'insertedAt',
        indexes: [
          {
            unique: false,
            fields: ['frameworkName', 'attemptIndex'],
          },
        ],
        freezeTableName: true,
      },
    );

    class Pod extends Model {}
    Pod.init(
      {
        insertedAt: Sequelize.DATE,
        uid: {
          type: Sequelize.STRING(36),
          primaryKey: true,
        },
        frameworkName: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        attemptIndex: Sequelize.INTEGER,
        taskroleName: Sequelize.STRING(256),
        taskroleIndex: Sequelize.INTEGER,
        taskAttemptIndex: Sequelize.INTEGER,
        snapshot: Sequelize.TEXT,
      },
      {
        sequelize,
        modelName: 'pod',
        createdAt: 'insertedAt',
        indexes: [
          {
            unique: false,
            fields: ['frameworkName'],
          },
        ],
      },
    );

    class FrameworkEvent extends Model {}
    FrameworkEvent.init(
      {
        insertedAt: Sequelize.DATE,
        uid: {
          type: Sequelize.STRING(36),
          primaryKey: true,
        },
        frameworkName: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        message: Sequelize.TEXT,
        event: Sequelize.TEXT,
      },
      {
        sequelize,
        modelName: 'framework_event',
        createdAt: 'insertedAt',
        indexes: [
          {
            unique: false,
            fields: ['frameworkName'],
          },
        ],
      },
    );

    class PodEvent extends Model {}
    PodEvent.init(
      {
        insertedAt: Sequelize.DATE,
        uid: {
          type: Sequelize.STRING(36),
          primaryKey: true,
        },
        frameworkName: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        podUid: {
          type: Sequelize.STRING(36),
          allowNull: false,
        },
        type: {
          type: Sequelize.STRING(32),
          allowNull: false,
        },
        message: Sequelize.TEXT,
        event: Sequelize.TEXT,
      },
      {
        sequelize,
        modelName: 'pod_event',
        createdAt: 'insertedAt',
        indexes: [
          {
            unique: false,
            fields: ['frameworkName'],
          },
        ],
      },
    );

    class Tag extends Model {}
    Tag.init(
      {
        insertedAt: Sequelize.DATE,
        uid: {
          type: Sequelize.STRING(36),
          primaryKey: true,
        },
        frameworkName: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
      },
      {
        sequelize,
        modelName: 'tag',
        createdAt: 'insertedAt',
        indexes: [
          {
            unique: false,
            fields: ['frameworkName'],
          },
        ],
      },
    );

    Framework.hasMany(FrameworkHistory);
    Framework.hasMany(Pod);
    Framework.hasMany(FrameworkEvent);
    Framework.hasMany(PodEvent);
    Framework.hasMany(Tag);

    class Version extends Model {}
    Version.init(
      {
        version: {
          type: Sequelize.STRING(36),
        },
        commitVersion: {
          type: Sequelize.STRING(64),
        },
      },
      {
        sequelize,
        modelName: 'version',
        freezeTableName: true,
      },
    );

    // bind to `this`
    this.sequelize = sequelize;
    this.Framework = Framework;
    this.FrameworkHistory = FrameworkHistory;
    this.Pod = Pod;
    this.FrameworkEvent = FrameworkEvent;
    this.PodEvent = PodEvent;
    this.Tag = Tag;
    this.Version = Version;
    this.synchronizeSchema = this.synchronizeSchema.bind(this);
  }

  async synchronizeSchema(force = false) {
    if (force === true) {
      await this.sequelize.sync({ force: true });
    } else {
      await Promise.all([
        this.Framework.sync({ alter: true }),
        this.FrameworkHistory.sync({ alter: true }),
        this.Pod.sync({ alter: true }),
        this.FrameworkEvent.sync({ alter: true }),
        this.PodEvent.sync({ alter: true }),
        this.Tag.sync({ alter: true }),
        this.Version.sync({ alter: true }),
      ]);
    }
  }

  async ping() {
    await this.sequelize.authenticate();
  }

  async getVersion() {
    let res;
    try {
      res = await this.Version.findOne();
    } catch (err) {}
    if (res) {
      return {
        version: res.version,
        commitVersion: res.commitVersion,
      };
    } else {
      return {
        version: null,
        commitVersion: null,
      };
    }
  }

  async setVersion(version, commitVersion) {
    await this.sequelize.transaction(async t => {
      await this.Version.destroy({
        where: {},
        transaction: t,
      });
      await this.Version.create(
        {
          version: version,
          commitVersion: commitVersion,
        },
        { transaction: t },
      );
    });
  }
}

module.exports = DatabaseModel;

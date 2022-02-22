import { default as json } from 'format-json';
import { default as jsonPatch } from 'fast-json-patch';
import { default as fs } from 'fs';
import { default as _ } from 'lodash';

// Class representing Feature flag functionality
export class LaunchDarklyUtilsFlags {
    /**
     * Feature flag specific api functions attached as 'LaunchDarklyUtils.flags'
     * @constructor LaunchDarklyUtilsFlags
     * @param { Swagger } apiClient - generated launchdarkly apiClient
     * @param { Object } log - logger implementation, or 'console'
     * @param { LaunchDarklyUtils } ldUtils - primary utils class
     * @returns { LaunchDarklyUtilsFlags } feature flag api functions
     */
    constructor(apiClient, log, ldUtils) {
        this.log = log;
        this.apiClient = apiClient;
        this.ldUtils = ldUtils;
        if (!this.ldUtils) {
            throw {
                message: 'LaunchDarklyUtilsRoles constructor requires ldUtils parameter'
            };
        }
    }

    /**
     * Api group object key in LD api
     * @returns {string}
     */
    get API_GROUP() {
        return 'Feature flags';
    }

    /**
     * Get all feature flags in project
     * @param {string} projectKey - project identifier
     * @returns {Promise}
     * @fulfil {Object} feature flag list json
     * @reject {Error} object with message
     * @example ldutils getFeatureFlags my-project
     */
    async getFeatureFlags(projectKey) {
        try {
            return this.apiClient.apis[this.API_GROUP].getFeatureFlags({ projectKey: projectKey }).then(response => {
                return response.body;
            });
        } catch (e) {
            throw {
                api: 'getFeatureFlags',
                message: e.message,
                docs: 'https://apidocs.launchdarkly.com/docs/list-feature-flags'
            };
        }
    }

    /**
     * Get a single feature flag by key, and optional environment
     * @param {string} projectKey - project identifier
     * @param {string} featureFlagKey - feature flag identifier
     * @param {string} environmentKeyQuery - optional environment name
     * @returns {Promise}
     * @fulfil {Object} feature flag json
     * @reject {Error} object with message
     * @example ldutils getFeatureFlag my-project my-flag dev
     */
    async getFeatureFlag(projectKey, featureFlagKey, environmentKeyQuery) {
        try {
            return this.apiClient.apis[this.API_GROUP]
                .getFeatureFlag({
                    projectKey: projectKey,
                    featureFlagKey: featureFlagKey,
                    env: environmentKeyQuery
                })
                .then(response => {
                    return response.body;
                });
        } catch (e) {
            throw {
                api: 'getFeatureFlag',
                message: e.message,
                docs: 'https://apidocs.launchdarkly.com/docs/get-feature-flag'
            };
        }
    }

    /**
     * Get the boolean state of a single feature flag by key, and optional environment
     * @param {string} projectKey - project identifier
     * @param {string} featureFlagKey - feature flag identifier
     * @param {string} environmentKeyQuery - environment name
     * @returns {Promise}
     * @fulfil {boolean} true/false
     * @reject {Error} object with message
     * @example ldutils getFeatureFlagState my-project my-flag dev
     */
    async getFeatureFlagState(projectKey, featureFlagKey, environmentKeyQuery) {
        return this.getFeatureFlag(projectKey, featureFlagKey, environmentKeyQuery).then(result => {
            return result.environments[environmentKeyQuery].on;
        });
    }

    /**
     * patch a feature flag by key
     * @param {string} projectKey - project identifier
     * @param {string} featureFlagKey - feature flag identifier
     * @param {Array<Object>} patchComment - array of valid json patch descriptors
     * @returns {Promise}
     * @fulfil {Object} updated feature flag json
     * @reject {Error} object with message
     * @example ldutils updateFeatureFlag my-project my-flag {jsonPatch}
     */
    async updateFeatureFlag(projectKey, featureFlagKey, patchComment) {
        try {
            return this.apiClient.apis[this.API_GROUP]
                .patchFeatureFlag({
                    projectKey: projectKey,
                    featureFlagKey: featureFlagKey,
                    patchComment: patchComment
                })
                .then(response => {
                    return response.body;
                });
        } catch (e) {
            throw {
                api: 'patchFeatureFlag',
                message: e.message,
                docs: 'https://apidocs.launchdarkly.com/docs/update-feature-flag'
            };
        }
    }

    /**
     * 
     * @param {string} projectKey - project identifier
     * @param {string} flagName - feature flag name
     * @param {string} flagKey - feature flag identifier
     * @param {string} flagDescription - feature flag description
     * @param {Object} flagVariations - feature flag variations
     * @param {boolean} flagTemporary - whether this flag is temporary
     * @param {string[]} flagTags - feature flag tags
     * @param {boolean} flagIncludeInSnippet - Whether this flag should be made available to the client-side JavaScript SDK.
     * @param {Object} flagClientSideAvailability - feature flag clientSide availability
     * @param {Object} flagDefaults - feature flag defaults
     * @returns {Promise}
     * @fulfil {Object} create feature flag json
     * @reject {Error} object with message
     * @example lduitls createFeatureFlag my-project my-flag my-flag-key my-flag-variations my-flag-defaults {description} {temporary} {tags} {includeInSnippet} {clientSideAvailability}
     */
    async createFeatureFlag(
        projectKey,
        flagName,
        flagKey,
        flagDescription,
        flagVariations,
        flagTemporary,
        flagTags,
        flagIncludeInSnippet,
        flagClientSideAvailability,
        flagDefaults
    ) {
        const flagObj = {
            name: flagName,
            key: flagKey,
            description: flagDescription,
            variations: flagVariations,
            temporary: flagTemporary,
            tags: flagTags,
            includeInSnippet: flagIncludeInSnippet,
            clientSideAvailability: flagClientSideAvailability,
            defaults: flagDefaults
        }
        try {
            return this.apiClient.apis[this.API_GROUP].createFeatureFlag({
                projectKey,
                ...flagObj
            }).then(response => {
                return response.body;
            })
        } catch (e) {
            throw {
                api: 'createFeatureFlag',
                message: e.message,
                docs: "https://launchdarkly.github.io/ld-openapi/#operation/postFeatureFlag"
            }
        }
    }

    /**
     * Set the boolean state of a single feature flag by key, and environment name
     * @param {string} projectKey - project identifier
     * @param {string} featureFlagKey - feature flag identifier
     * @param {string} environmentKeyQuery - environment name
     * @param {boolean} value - true or false
     * @returns {Promise}
     * @fulfil {Object} updated feature flag json
     * @reject {Error} object with message
     * @example ldutils toggleFeatureFlag my-project my-flag dev true
     */
    async toggleFeatureFlag(projectKey, featureFlagKey, environmentKeyQuery, value) {
        return this.updateFeatureFlag(projectKey, featureFlagKey, [
            { op: 'replace', path: `/environments/${environmentKeyQuery}/on`, value: value }
        ]);
    }

    /**
     * Migrate feature flag properties between environments in a project. this includes:
     * targets, rules, fallthrough, offVariation, prerequisites and optionally the flags on/off state.
     * @param {string} projectKey - project identifier
     * @param {string} featureFlagKey - feature flag identifier
     * @param {string} fromEnv - environment to copy flag attributes from
     * @param {string} toEnv - environment to copy flag attributes to
     * @param {boolean} includeState - optionally copy boolean state true/false
     * @returns {Promise}
     * @fulfil {Object} updated feature flag json
     * @reject {Error} object with message
     * @example ldutils migrateFeatureFlag my-project my-flag dev test
     */
    async migrateFeatureFlag(projectKey, featureFlagKey, fromEnv, toEnv, includeState) {
        let that = this;

        return this.getFeatureFlag(projectKey, featureFlagKey)
            .then(flag => {
                let patchDelta = jsonPatch.compare(flag.environments[toEnv], flag.environments[fromEnv]);
                that.log.debug(`flagDelta for '${featureFlagKey}' ${json.plain(patchDelta)}`);
                return patchDelta;
            })
            .then(patchDelta => {
                let patchComment = this.assembleFlagPatch(patchDelta, toEnv, includeState);

                that.log.debug(`patchComment for '${featureFlagKey}' in ${toEnv} : ${json.plain(patchComment)}`);
                return this.updateFeatureFlag(projectKey, featureFlagKey, patchComment);
            });
    }

    assembleFlagPatch(patchDelta, targetEnv, includeState) {
        let patchComment = [];
        patchDelta.forEach(patch => {
            if (
                patch.path.startsWith('/targets') ||
                patch.path.startsWith('/rules') ||
                patch.path.startsWith('/fallthrough') ||
                patch.path.startsWith('/offVariation') ||
                patch.path.startsWith('/prerequisites') ||
                (includeState && patch.path.startsWith('/on'))
            ) {
                // add target env obj path and push
                patch.path = `/environments/${targetEnv}${patch.path}`;
                patchComment.push(patch);
            }
        });
        return patchComment;
    }

    /**
     * Migrate multiple feature flags properties between environments in a project. this includes:
     * targets, rules, fallthrough, offVariation, prerequisites and optionally the flags on/off state.
     * @param {string} projectKey - project identifier
     * @param {string} featureFlagKeys - comma-separated feature flag identifiers
     * @param {string} fromEnv - environment to copy flag attributes from
     * @param {string} toEnv - environment to copy flag attributes to
     * @param {boolean} includeState - optionally copy boolean state true/false
     * @returns {Promise}
     * @fulfil {Object} updated feature flag json array
     * @reject {Error} object with message
     * @example ldutils bulkMigrateFeatureFlags my-project my-flag,my-flag-two dev test
     */
    async bulkMigrateFeatureFlags(projectKey, featureFlagKeys, fromEnv, toEnv, includeState) {
        let promises = [];

        featureFlagKeys.split(',').forEach(key => {
            promises.push(this.migrateFeatureFlag(projectKey, key, fromEnv, toEnv, includeState));
        });

        return Promise.all(promises);
    }

    /**
     * Restore feature flags to state captured in a backup json file generated by getFeatureFlags(proj).
     * @param {string} projectKey - project identifier
     * @param {string} featureFlagKeys - feature flag identifiers comma separated
     * @param {string} targetEnv - environment to restore flag attributes to
     * @param {string} backupJsonFile - file to restore from from getFeatureFlags(proj)
     * @param {boolean} includeState - optionally restore boolean state true/false
     * @returns {Promise}
     * @fulfil {Object} updated feature flag json
     * @reject {Error} object with message
     * @example ldutils restoreFeatureFlags my-project my-flag,my-flag-two prod ./preReleaseBackup.json true
     */
    async restoreFeatureFlags(projectKey, featureFlagKeys, targetEnv, backupJsonFile, includeState) {
        let that = this;
        let promises = [];

        const backupJson = JSON.parse(fs.readFileSync(process.cwd() + '/' + backupJsonFile, 'utf-8'));

        //foreach flag, lookup node in env branch
        featureFlagKeys.split(',').forEach(key => {
            promises.push(
                this.getFeatureFlag(projectKey, key)
                    .then(flag => {
                        let backupFlagArr = _.filter(backupJson.items, { key: key });
                        if (backupFlagArr.length === 0) {
                            that.log.error(`flag does not exist in backup: ${key}`);
                        }
                        let backupFlag = backupFlagArr[0];
                        that.log.debug(`backupFlag: ${json.plain(backupFlag)}`);
                        let patchDelta = jsonPatch.compare(
                            flag.environments[targetEnv],
                            backupFlag.environments[targetEnv]
                        );
                        that.log.debug(`flagDelta for '${key}' ${json.plain(patchDelta)}`);
                        return patchDelta;
                    })
                    .then(patchDelta => {
                        let patchComment = this.assembleFlagPatch(patchDelta, targetEnv, includeState);

                        that.log.debug(`patchComment for '${key}' in ${targetEnv} : ${json.plain(patchComment)}`);
                        return this.updateFeatureFlag(projectKey, key, patchComment);
                    })
            );
        });

        return Promise.all(promises);
    }
}

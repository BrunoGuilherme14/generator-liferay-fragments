const fs = require('fs');
const glob = require('glob');
const path = require('path');
const { log, LOG_LEVEL } = require('../utils/log');

/**
 * @param {string} jsonPath
 * @return {object}
 */
function _readJSONSync(jsonPath) {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

/**
 * Get a list of project collections from a given basePath
 * @param {string} basePath Base path
 * @return {import('../types/index').ICollection[]}
 */
function _getProjectCollections(basePath) {
  return glob
    .sync(path.join(basePath, 'src', '*', 'collection.json'))
    .map(
      /** @param {string} collectionJSON */
      collectionJSON => path.resolve(collectionJSON, '..')
    )
    .filter(directory => {
      try {
        _readJSONSync(path.resolve(directory, 'collection.json'));
        return true;
      } catch (error) {
        log(`✘ Invalid ${directory}/collection.json, collection ignored`, {
          level: 'LOG_LEVEL_ERROR'
        });

        return false;
      }
    })
    .map(
      /**
       * @param {string} directory
       * @return {import('../types/index').ICollection}
       */
      directory => {
        const metadata = _readJSONSync(
          path.resolve(directory, 'collection.json')
        );
        const fragmentCompositions = _getCollectionFragmentCompositions(
          directory
        );
        const fragments = _getCollectionFragments(directory);
        const slug = path.basename(directory);

        return {
          slug,
          fragmentCollectionId: slug,
          metadata,
          fragmentCompositions,
          fragments
        };
      }
    );
}

/**
 * Get a list of fragments from a given collection directory
 * @param {string} collectionDirectory
 * @return {import('../types/index').IFragment[]}
 */
function _getCollectionFragments(collectionDirectory) {
  return glob
    .sync(path.join(collectionDirectory, '*', 'fragment.json'))
    .map(
      /** @param {string} fragmentJSON */
      fragmentJSON => path.resolve(fragmentJSON, '..')
    )
    .filter(directory => {
      try {
        _readJSONSync(path.resolve(directory, 'fragment.json'));
        return true;
      } catch (error) {
        log(`✘ Invalid ${directory}/fragment.json, fragment ignored`, {
          level: 'LOG_LEVEL_ERROR'
        });

        return false;
      }
    })
    .map(
      /** @param {string} directory */
      directory => {
        const metadata = _readJSONSync(
          path.resolve(directory, 'fragment.json')
        );

        /**
         * @param {string} filePath
         * @return {string}
         */
        const readFile = filePath => {
          try {
            return fs.readFileSync(path.resolve(directory, filePath), 'utf-8');
          } catch (error) {
            log(`✘ Fragment ${metadata.name || directory}`, {
              level: LOG_LEVEL.error,
              newLine: true
            });

            log(`File ${filePath} was not found`);

            return '';
          }
        };

        const fragment = {
          slug: path.basename(directory),
          metadata,

          html: readFile(metadata.htmlPath),
          css: readFile(metadata.cssPath),
          js: readFile(metadata.jsPath),

          configuration: _getFramentConfiguration(
            directory,
            metadata.configurationPath
          )
        };

        return fragment;
      }
    );
}

/**
 * Get a list of fragments from a given collection directory
 * @param {string} collectionDirectory
 * @return {import('../types/index').IFragmentComposition[]}
 */
function _getCollectionFragmentCompositions(collectionDirectory) {
  return glob
    .sync(path.join(collectionDirectory, '*', 'fragment-composition.json'))
    .map(
      /** @param {string} fragmentJSON */
      compositionJSON => path.resolve(compositionJSON, '..')
    )
    .filter(directory => {
      try {
        _readJSONSync(path.resolve(directory, 'fragment-composition.json'));
        return true;
      } catch (error) {
        log(
          `✘ Invalid ${directory}/fragment-composition.json, fragment composition ignored`,
          {
            level: 'LOG_LEVEL_ERROR'
          }
        );

        return false;
      }
    })
    .map(
      /** @param {string} directory */
      directory => {
        const metadata = _readJSONSync(
          path.resolve(directory, 'fragment-composition.json')
        );

        /**
         * @param {string} filePath
         * @return {string}
         */
        const readFile = filePath => {
          try {
            return fs.readFileSync(path.resolve(directory, filePath), 'utf-8');
          } catch (error) {
            log(`✘ Fragment composition ${metadata.name || directory}`, {
              level: LOG_LEVEL.error,
              newLine: true
            });

            log(`File ${filePath} was not found`);

            return '';
          }
        };

        const fragmentComposition = {
          slug: path.basename(directory),
          metadata,
          definitionData: readFile(metadata.fragmentCompositionDefinitionPath)
        };

        return fragmentComposition;
      }
    );
}

/**
 * Gets the fragment configuration from its file, if exist, if not it
 * returns an empty string
 * @param {string} directory
 * @param {string} configurationPath
 * @return {string} Configuration
 */
function _getFramentConfiguration(directory, configurationPath) {
  if (
    configurationPath &&
    fs.existsSync(path.resolve(directory, configurationPath))
  ) {
    return fs.readFileSync(path.resolve(directory, configurationPath), 'utf-8');
  }

  return '';
}

/**
 * Get a list of project page templates from a given basePath
 * @param {string} basePath Base path
 * @return {import('../types/index').IPageTemplate[]}
 */
function _getPageTemplates(basePath) {
  return glob
    .sync(path.join(basePath, 'src', '*', 'page-template.json'))
    .map(
      /** @param {string} collectionJSON */
      collectionJSON => path.resolve(collectionJSON, '..')
    )
    .filter(directory => {
      try {
        _readJSONSync(path.resolve(directory, 'page-template.json'));
        return true;
      } catch (error) {
        log(
          `✘ Invalid ${directory}/page-template.json, page template ignored`,
          {
            level: 'LOG_LEVEL_ERROR'
          }
        );

        return false;
      }
    })
    .map(
      /**
       * @param {string} directory
       * @return {import('../types/index').IPageTemplate}
       */
      directory => {
        const metadata = _readJSONSync(
          path.resolve(directory, 'page-template.json')
        );
        const slug = path.basename(directory);

        return {
          slug,
          metadata: {
            name: metadata.name,
            pageTemplateDefinitionPath: path.resolve(
              directory,
              'page-definition.json'
            )
          },
          definitionData: JSON.stringify(
            _readJSONSync(path.resolve(directory, 'page-definition.json'))
          )
        };
      }
    );
}

/**
 * Gets a project definition from a given basePath
 * @param {string} basePath Base path
 * @return {import('../types/index').IProject} Project
 */
function getProjectContent(basePath) {
  return {
    basePath,
    project: _readJSONSync(path.resolve(basePath, 'package.json')),
    collections: _getProjectCollections(basePath),
    pageTemplates: _getPageTemplates(basePath)
  };
}

module.exports = getProjectContent;

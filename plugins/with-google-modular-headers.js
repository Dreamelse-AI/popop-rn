const { withDangerousMod } = require('expo/config-plugins')
const fs = require('fs')
const path = require('path')

const PODFILE_MARKER = "pod 'GoogleUtilities', :modular_headers => true"

/**
 * Google Sign-In (AppCheckCore) needs module maps when linked as static libraries.
 */
function withGoogleModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile')
      let contents = fs.readFileSync(podfilePath, 'utf8')

      if (!contents.includes(PODFILE_MARKER)) {
        contents = contents.replace(
          /use_expo_modules!\n/,
          `use_expo_modules!\n\n  pod 'GoogleUtilities', :modular_headers => true\n  pod 'RecaptchaInterop', :modular_headers => true\n`,
        )
        fs.writeFileSync(podfilePath, contents)
      }

      return config
    },
  ])
}

module.exports = withGoogleModularHeaders

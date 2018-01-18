const path = require('path');

const productionConfigPath = path.join(__dirname, './production.js' );
const devConfigPath = path.join(__dirname, './development.js' );

if( process.env.NODE_ENV === 'production' ){
  module.exports = require( productionConfigPath );
} else {
  module.exports = require( devConfigPath );
}

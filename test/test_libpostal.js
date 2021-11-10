const postal = require('node-postal');

// Expansion API
 postal.expand.expand_address('V XX Settembre, 20');

// Parser API
postal.parser.parse_address('Barboncino 781 Franklin Ave, Crown Heights, Brooklyn, NY 11238');

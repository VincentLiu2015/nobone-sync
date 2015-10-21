var Promise, client, conf, createPassed, cs, deletePassed, executePassed, kit, modifyPassed, now, server, statsPassed;

client = require('../client');

server = require('../server');

kit = require('nokit');

Promise = kit.Promise;

cs = kit.require('colors/safe');

now = Date.now() + '';

modifyPassed = false;

createPassed = false;

deletePassed = false;

statsPassed = false;

executePassed = false;

conf = {
  localDir: 'test/local',
  remoteDir: 'test/remote',
  host: '127.0.0.1',
  port: 8345,
  password: 'test',
  pattern: ['**'],
  pollingInterval: 30,
  onChange: function(type, path, oldPath, stats) {
    if (path === 'test/local/b.css') {
      if (type === 'modify') {
        modifyPassed = true;
      }
    }
    if (path === 'test/local/d') {
      setTimeout(function() {
        return deletePassed = !kit.existsSync('test/remote/d');
      }, 100);
    }
    if (path === 'test/local/dir/path/a.txt') {
      return setTimeout(function() {
        var s;
        s = kit.readFileSync('test/remote/dir/path/a.txt', 'utf8');
        statsPassed = kit.statSync('test/remote/dir/path/a.txt').mode.toString(8)[3] === '7';
        createPassed = s === now;
        kit.log([modifyPassed, deletePassed, createPassed, statsPassed, executePassed]);
        if (modifyPassed && deletePassed && createPassed && statsPassed && executePassed) {
          return process.exit(0);
        } else {
          kit.err(cs.red('Sync does not work!'));
          return process.exit(1);
        }
      }, 500);
    }
  }
};

kit.touchSync('test/local/d');

kit.touchSync('test/remote/d');

client(conf);

server(kit._.defaults({
  onChange: function(type) {
    return new Promise(function(r) {
      return setTimeout(r, 1);
    });
  }
}, conf));

setTimeout(function() {
  return client.send({
    conf: conf,
    remotePath: '.coffee',
    type: 'execute',
    source: 'require(\'nokit\').log \'OK\'\nthrow \'error\''
  }).then(function(out) {
    return executePassed = out.toString().indexOf('OK') > 0 && out.toString().indexOf('error') > 0;
  });
}, 100);

setTimeout(function() {
  return kit.touchSync('test/local/b.css');
}, 400);

setTimeout(function() {
  return kit.removeSync('test/local/d');
}, 500);

setTimeout(function() {
  return kit.outputFileSync('test/local/dir/path/a.txt', now, {
    mode: 0x1ff
  });
}, 600);

process.on('exit', function() {
  kit.removeSync('test/local/dir/path');
  kit.removeSync('test/remote/dir/path');
  return kit.removeSync('test/local/d');
});

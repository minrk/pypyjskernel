define([
    "base/js/namespace",
], function (IPython) {
    
    var kernel_info = function (callback) {
        var reply = this._get_msg("kernel_info_reply", {
            protocol_version: '5.0.0',
            implementation: 'pypyjs',
            implementation_version: '0.0.1',
            language_info: {
                name: "python",
                mimetype: "text/x-python",
                file_extension: '.py'
            }
        });
        
        if (callback) {
            callback(reply);
        }
    };
    
    var disabled = function () {};
    
    var return_true = function () {
        return true;
    };
    
    var return_false = function () {
        return false;
    };
    
    var _executing = false;
    var _to_execute = [];
    
    var execute = function (code, callbacks, options) {
        if (_executing) {
            _to_execute.push([code, callbacks, options]);
            return;
        }
        _executing = true;
        
        var vm = IPython.notebook.kernel._vm;
        var that = this;
        var request = this._get_msg("execute_request", {code: code});
        this.set_callbacks_for_msg(request.header.msg_id, callbacks);
        
        var r = null;
        var success = true;
        
        function _stream_output (name) {
            return function (data) {
                var msg = that._get_msg("stream", {name: name, text: data});
                msg.parent_header = request.header;
                that._handle_iopub_message(msg);
            };
        }
        vm.stdout = _stream_output('stdout');
        vm.stderr = _stream_output('stderr');
        // execution adapted from pypy.js example website
        code = code.replace(/\\/g, "\\\\").replace(/'''/g, "\\'\\'\\'");
        code = "r = c.runsource('''" + code + "''', '<input>', 'exec')";
        vm.eval(code).then(function() {
            _finish_execute.apply(that, [r, request, true]);
        });
    };
    
    var _finish_execute = function (r, request, success) {
        var that = this;
        var reply = this._get_msg("execute_reply", {
            status : "ok",
            execution_count: this.execution_count
        });
        reply.parent_header = request.header;
        var result = null;
        if (r !== null && r !== undefined) {
            if (success) {
                result = this._get_msg("execute_result", {
                    execution_count: this.execution_count,
                    data : {
                        'text/plain' : "" + r
                    },
                    metadata : {}
                });
            } else if (!success){
                result = that._get_msg("error", {
                    execution_count: that.execution_count,
                    ename : r.name,
                    evalue : r.message,
                    traceback : [r.stack]
                });
            }
            result.parent_header = request.header;
            that._handle_iopub_message(result);
        }

        var idle = this._get_msg("status", {status: "idle"});
        idle.parent_header = request.header;

        this.execution_count = this.execution_count + 1;
        this._handle_iopub_message(idle);
        this._handle_shell_reply(reply);
        _executing = false;
        if (_to_execute.length) {
            this.execute.apply(this, _to_execute.shift());
        }
    };
    
    var onload = function () {
    
    require(['./pypy.js-0.2.0/lib/pypy.js'], function () {
        var kernel = IPython.notebook.kernel;
        console.log("monkeypatching kernel for in-browser PyPy.js", kernel);
        kernel.execution_count = 1;
        var vm = kernel._vm = new PyPyJS();
        // monkeypatch methods
        kernel.is_connected = return_true;
        kernel.is_fully_disconnected = return_false;
        kernel.inspect = kernel.complete = disabled;
        kernel.execute = execute;
        kernel.kernel_info = kernel_info;
        
        // stop websockets, and signal that we are all connected
        for (var c in kernel.channels) {
            var channel = kernel.channels[c];
            channel.onclose = disabled;
            channel.onerror = disabled;
        }
        kernel.start_channels = function () {
            kernel._kernel_connected();
        };
        kernel.stop_channels();
        vm.eval('import code').then(function () {
            vm.eval('c = code.InteractiveInterpreter()').then(function() {
                kernel.start_channels();
            });
        });
    });
    };
    
    return {
        onload: onload
    };
});
"""Loaded by Python in each container worker via PYTHONPATH=/app/overrides."""
import os
if os.environ.get('TSP_SOURCE_POLICY') == '1':
    try:
        from overrides.source_policy import install_network_guard, install_app_policy
        install_network_guard()
        install_app_policy()
    except BaseException:
        # Python normally swallows sitecustomize errors; a policy failure must stop
        # the interpreter before any application or vendor code can execute.
        import sys
        sys.stderr.write('SOURCE_POLICY_INITIALIZATION_FAILED; refusing to start\n')
        os._exit(78)

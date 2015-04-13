# In-browser PyPy.js kernel for Jupyter

To run a pypy.js kernel in-browser instead of remote via websockets,
just clone this repo into your IPython kernels directory:

```bash
cd $(ipython locate)/kernels
git clone https://github.com/minrk/pypyjskernel
```

```
Cloning into 'pypyjskernel'...
remote: Counting objects: 11, done.
remote: Compressing objects: 100% (8/8), done.
remote: Total 11 (delta 0), reused 11 (delta 0)
Unpacking objects: 100% (11/11), done.
```

You should now be able to select 'PyPy.js' from the kernel selection drop-down.

Requires IPython ≥ 3.

The kernel code is Copyright (c) Min Ragan-Kelley, licensed under 3-clause BSD.
PyPy.js is Copyright (c) Ryan Kelly, and used under the MIT license.

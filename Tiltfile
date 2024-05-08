k8s_yaml('control-plane/postgres.dev.yaml')
k8s_resource('postgres', port_forwards=5432)

k8s_yaml('control-plane/kubernetes.dev.yaml')
k8s_resource('control-plane', port_forwards=[
  port_forward(4000, 4000, "api"),
  port_forward(9091, 9091, 'metrics')
], resource_deps=['postgres'])

docker_build('control-plane-image', 'control-plane', dockerfile='control-plane/Dockerfile.dev', live_update=[
  sync('./control-plane/.env', '/app/.env'),
  sync('./control-plane/src', '/app/src'),
  sync('./control-plane/package.json', '/app/package.json'),
  sync('./control-plane/package-lock.json', '/app/package-lock.json'),
  run(
    'npm install',
    trigger=['./control-plane/package.json', './control-plane/package-lock.json'],
  )
], network='host')

k8s_yaml('admin/kubernetes.dev.yaml')
k8s_resource('admin', port_forwards=['3000'], resource_deps=['control-plane'])

docker_build('admin-image', 'admin', dockerfile='admin/Dockerfile.dev', live_update=[
  sync('./admin/client', '/app/client'),
  sync('./admin/app', '/app/app'),
  sync('./admin/components', '/app/components'),
  sync('./admin/lib', '/app/lib'),
  sync('./admin/package.json', '/app/package.json'),
  sync('./admin/package-lock.json', '/app/package-lock.json'),
  run(
    'npm install',
    trigger=['./admin/package.json', './admin/package-lock.json'],
  )
], ignore='.next', network='host')
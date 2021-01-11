# Installation Guide

The architecture of OpenPAI has been updated and optimized in `v1.0.0`. Before `v1.0.0`, OpenPAI was based on Yarn and Kubernetes, and data was managed by HDFS. Since `v1.0.0`, OpenPAI has switched to a pure Kubernetes-based architecture. Many new features, such as `AAD authorization`, `Hivedscheduler`, `Kube Runtime`, `Marketplace`, etc., are also included. If you still want to install the old Yarn-based OpenPAI, please stay with `v0.14.0`.

To install OpenPAI >= `v1.0.0`, please first check [Installation Requirements](#installation-requirements). Then, if you don't have older version OpenPAI installed, please follow [Installation From Scratch](#installation-from-scratch). Otherwise, please first follow [Clean Previous Deployment](#clean-previous-deployment), then follow [Installation From Scratch](#installation-from-scratch).

## Installation Requirements

The deployment of OpenPAI requires you to have **at least 3 separate machines**: one dev box machine, one master machine, and one worker machine.

Dev box machine controls masters and workers through SSH during installation, maintenance, and uninstallation. There should be one, and only one dev box. 

The master machine is used to run core Kubernetes components and core OpenPAI services. Currently, OpenPAI does not support high availability and you can only specify one master machine. We recommend you use CPU-only machines for dev box and master.

The detailed requirements for dev box machine and master machine are as follows:

<table>
<thead>
  <tr>
    <th></th>
    <th>Hardware Requirements</th>
    <th>Software Requirements</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>Dev Box Machine</td>
    <td>
      <ul>
        <li>It can communicate with all other machines (master and worker machines).</li> 
        <li>It is separate from the cluster which contains master machines and worker machines.</li>
        <li>It can access the internet, especially needs to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>Ubuntu 16.04 (18.04 should work, but not fully tested)</li>
        <li>SSH service is enabled.</li>
        <li>Passwordless ssh to all other machines (master and worker machines).</li>
        <li>Docker is installed.</li>
      </ul> 
    </td>
  </tr>
  <tr>
    <td>Master Machine</td>
    <td>
      <ul>
        <li>At least 40GB of free memory.</li>
        <li>It has a <b>static LAN IP address</b>, and make sure it can communicate with all other machines.</li>
        <li>It can access the internet, especially needs to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>Ubuntu 16.04 (18.04 should work, but not fully tested)</li>
        <li>SSH service is enabled. </li>
        <li>It shares the same username/password with worker machines, and have sudo privilege.</li>
        <li>Docker is installed.</li>
        <li>NTP service is enabled. You can use <code>apt install ntp</code> to check it.</li>
        <li>It is a dedicated server for OpenPAI. OpenPAI manages its all resources, including CPU, memory, GPU (or other computing devices). If there is any other workload, it may cause unknown problem due to insufficient resource.</li>
      </ul>
    </td>
  </tr>
</tbody>
</table>

The worker machines are used to run jobs. We support various types of workers: CPU worker, GPU worker, and workers with other computing device (e.g. TPU, NPU). In the same time, We also have two schedulers: the Kubernetes scheduler, and [hivedscheduler](https://github.com/microsoft/hivedscheduler). You can use multiple workers during installation.

Hivedscheduler is the default one. It supports virtual cluster division, topology-aware resource guarantee and optimized gang scheduling, which are not supported in k8s scheduler. For CPU worker and NVIDIA GPU worker, both k8s scheduler and hived scheduler can be used. For other types of computing device, currently we only support the usage of k8s scheduler.

Please check the following requirements for different types of worker machines:

<table>
<thead>
  <tr>
    <th>Worker Type</th>
    <th>Hardware Requirements</th>
    <th>Software Requirements</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>CPU Worker</td>
    <td>
      <ul>
        <li>At least 16GB of free memory.</li>
        <li>It has a <b>static LAN IP address</b>, and make sure it can communicate with all other machines.</li>
        <li>It can access the internet, especially needs to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.</li>
      </ul>
    </td>
    <td>
      <ul>
        <li>Ubuntu 16.04 (18.04 should work, but not fully tested)</li>
        <li>SSH service is enabled. </li>
        <li>It shares the same username/password with all other machines, and have sudo privilege.</li>
        <li>Docker is installed.</li>
        <li>It is a dedicated server for OpenPAI. OpenPAI manages its all resources, including CPU, memory, GPU (or other computing devices). If there is any other workload, it may cause unknown problem due to insufficient resource.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>NVIDIA GPU Worker</td>
    <td>The same as above.</td>
    <td>
      The same as <code>CPU worker</code>, and with the following additional requirements:
      <ul>
        <li><b>NVIDIA GPU Driver is installed.</b> You may use <a href="./installation-faqs-and-troubleshooting.md#how-to-check-whether-the-gpu-driver-is-installed">a command</a> to check it. Refer to <a href="./installation-faqs-and-troubleshooting.md#how-to-install-gpu-driver">the installation guidance</a> in FAQs if the driver is not successfully installed. If you are wondering which version of GPU driver you should use, please also refer to <a href="./installation-faqs-and-troubleshooting.md#which-version-of-nvidia-driver-should-i-install">FAQs</a>.</li>
        <li><b><a href="https://github.com/NVIDIA/nvidia-container-runtime">nvidia-container-runtime</a>is installed. And be configured as the default runtime of docker.</b> Please configure it in <a href="https://docs.docker.com/config/daemon/#configure-the-docker-daemon">docker-config-file</a>, because systemd's env will be overwritten during installation. You can use command <code>sudo docker run nvidia/cuda:10.0-base nvidia-smi</code> to check it. This command should output information of available GPUs if it is setup properly. Refer to <a href="./installation-faqs-and-troubleshooting.md#how-to-install-nvidia-container-runtime">the installation guidance</a> if the it is not successfully set up.</li>
      </ul>  
    </td>
  </tr>
  <tr>
    <td>Enflame DTU Worker</td>
    <td>The same as above.</td>
    <td>
      The same as <code>CPU worker</code>, and with the following additional requirements:
      <ul>
        <li>Enflame DTU Driver is installed.</li>
        <li>Enflame container runtime is installed. And be configured as the default runtime of docker. Please configure it in <a href="https://docs.docker.com/config/daemon/#configure-the-docker-daemon">docker-config-file</a>, because systemd's env will be overwritten during installation.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>Other Computing Device</td>
    <td>The same as above.</td>
    <td>
      The same as <code>CPU worker</code>, and with the following additional requirements:
      <ul>
        <li>The driver of the device is installed.</li>
        <li>The container runtime of the device is installed. And be configured as the default runtime of docker. Please configure it in <a href="https://docs.docker.com/config/daemon/#configure-the-docker-daemon">docker-config-file</a>, because systemd's env will be overwritten during installation.</li>
        <li>You should have a deployable <a href="https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/device-plugins/">device plugin</a> of the computing device. After the Kubernetes is set up, you should manually deploy it in cluster. </li>
      </ul>  
    </td>
  </tr>
</tbody>
</table>

#### Tips for Network-related Issues
If you are facing network issues such as the machine cannot download some file, or cannot connect to some docker registry, please combine the prompted error log and kubespray as a keyword, and search for solution. You can also refer to the [installation troubleshooting](./installation-faqs-and-troubleshooting.md#troubleshooting) and [this issue](https://github.com/microsoft/pai/issues/4516).

## Installation From Scratch

There mainly 3 steps to install OpenPAI from scratch:

* Prepare configuration files for both Kubernetes and OpenPAI
* Start Kubernetes
* Start OpenPAI services

### Prepare Configurations Files

After you have decided all of the machines, please edit `layout.yaml` and a `config.yaml` file under `pai/contrib/kubespray/config` folder.
These two files spedify the cluster layout and the customized configuration, respectively.
The following is the format and example of these 2 files.

#### Tips for China Users

If you are a China user, before you edit these files, please refer to [here](./configuration-for-china.md) first.

#### `layout.yaml` format

``` yaml
machine-sku:
  master-machine: # define a machine sku
    # the resource requirements for all the machines of this sku
    mem: 60GB
    cpu:
      vcore: 24
  gpu-machine:
    computing-device:
      type: nvidia.com/gpu
      model: K80
      count: 4
    mem: 220GB
    cpu:
      vcore: 24

machine-list:
  - hostname: pai-master # name of the machine, **do not** use upper case alphabet letters for hostname
    hostip: 10.0.0.1
    machine-type: master-machine # only one master-machine supported
    pai-master: "true"
  - hostname: pai-worker1
    hostip: 10.0.0.2
    machine-type: gpu-machine
    pai-worker: "true"
  - hostname: pai-worker2
    hostip: 10.0.0.3
    machine-type: gpu-machine
    pai-worker: "true"
```

#### `config.yaml` example

``` yaml
user: <your-ssh-username>
password: <your-ssh-password>
docker_image_tag: v1.5.0

# Optional

#############################################
# Ansible-playbooks' inventory hosts' vars. #
#############################################
# ssh_key_file_path: /path/to/you/key/file

#####################################
# OpenPAI's service image registry. #
#####################################
# docker_registry_domain: docker.io
# docker_registry_namespace: openpai
# docker_registry_username: exampleuser
# docker_registry_password: examplepasswd

################################################################
# OpenPAI's daemon qos config.                                 #
# By default, the QoS class for PAI daemon is BestEffort.      #
# If you want to promote QoS class to Burstable or Guaranteed, #
# you should set the value to true.                            #
################################################################
# qos-switch: "false"

########################################################################################
# Advanced docker configuration. If you are not familiar with them, don't change them. #
########################################################################################
# docker_data_root: /mnt/docker
# docker_config_file_path: /etc/docker/daemon.json
# docker_iptables_enabled: false

## An obvious use case is allowing insecure-registry access to self hosted registries.
## Can be ipaddress and domain_name.

## example define 172.19.16.11 or mirror.registry.io
# openpai_docker_insecure_registries:
#   - mirror.registry.io
#   - 172.19.16.11

## Add other registry,example China registry mirror.

# openpai_docker_registry_mirrors:
#   - https://registry.docker-cn.com
#   - https://mirror.aliyuncs.com

#######################################################################
#                       kubespray setting                             #
#######################################################################

# If you couldn't access to gcr.io or docker.io, please configure it.
# gcr_image_repo: "gcr.io"
# kube_image_repo: "gcr.io/google-containers"
# quay_image_repo: "quay.io"
# docker_image_repo: "docker.io"
# kubeadm_download_url: "https://storage.googleapis.com/kubernetes-release/release/{{ kubeadm_version }}/bin/linux/{{ image_arch }}/kubeadm"
# hyperkube_download_url: "https://storage.googleapis.com/kubernetes-release/release/{{ kube_version }}/bin/linux/{{ image_arch }}/hyperkube"

# openpai_kube_network_plugin: calico
```

The `user` and `password` is the SSH username and password from dev box machine to master machines and worker machines, you should make sure all masters and workers share the same SSH username and password. As for optional configurations, customize them if you know exactly what they are.

**For Azure Users**: If you are deploying OpenPAI in Azure, please uncomment `openpai_kube_network_plugin: calico` in the config file above, and change it to `openpai_kube_network_plugin: weave`. It is because Azure doesn't support calico. See [here](https://docs.projectcalico.org/reference/public-cloud/azure#why-doesnt-azure-support-calico-networking) for details.

**If qos-switch is enabled**: OpenPAI daemons will request addition resources in each node. Please check following table and reserve sufficient resources for OpenPAI daemons.

| Service Name  | Memory Request | CPU Request |
| :-----------: | :------------: | :---------: |
| node-exporter |     128Mi      |      0      |
| job-exporter  |     512Mi      |      0      |
|  log-manager  |     256Mi      |      0      |

### Start Kubernetes

On the dev box machine, use the following commands to clone the OpenPAI repo:

``` bash
git clone -b pai-1.4.y https://github.com/microsoft/pai.git # change to a different branch if you want to deploy a different version
cd pai/contrib/kubespray
```

The folder `pai/contrib/kubespray` contains installation scripts, both for kubespray and OpenPAI services.
Please run the following script to deploy Kubernetes first:

``` bash
/bin/bash quick-start-kubespray.sh
```

### Start OpenPAI Services

After Kubernetes is successfully started, run the following script to start OpenPAI services.

``` bash
/bin/bash quick-start-service.sh
```

If everything goes well, you will get a message as follows:

``` bash
Kubernetes cluster config :     ~/pai-deploy/kube/config
OpenPAI cluster config    :     ~/pai-deploy/cluster-cfg
OpenPAI cluster ID        :     pai
Default username          :     admin
Default password          :     admin-password

You can go to http://<your-master-ip>, then use the default username and password to log in.
```

As the message says, you can use `admin` and `admin-password` to login to the webportal, then submit a job to validate your installation.

#### Tips for Checking Requirements

If there is any error, please double check the environment requirements first. Here we provide a requirement checker to help you verify:

``` bash
/bin/bash requirement.sh
```

#### Keep a Folder

We highly recommend you to keep the folder `~/pai-deploy` for future operations such as upgrade, maintenance, and uninstallation. The most important contents in this folder are:

  + Kubernetes cluster config (the default is `~/pai-deploy/kube/config`): Kubernetes config file. It is used by `kubectl` to connect to k8s api server.
  + OpenPAI cluster config (the default is  `~/pai-deploy/cluster-cfg`): It is a folder containing machine layout and OpenPAI service configurations.

If it is possible, you can make a backup of `~/pai-deploy` in case it is deleted unexpectedly.

Apart from the folder, you should remember your OpenPAI cluster ID, which is used to indicate your OpenPAI cluster.
The default value is `pai`. Some management operation needs a confirmation of this cluster ID.

## Clean Previous Deployment

### Save your Data to a Different Place

If you have installed OpenPAI before `v1.0.0`, to install OpenPAI >= `v1.0.0`, you should first clean the previous deployment. You cannot preserve any useful data: all jobs, user information, dataset will be lost inevitably and irreversibly. Thus, if you have any useful data in previous deployment, please make sure you have saved them to a different place.

#### HDFS Data

Before `v1.0.0`, PAI will deploy an HDFS server for you. After `v1.0.0`, the HDFS server won't be deployed and previous data will be removed in upgrade. The following commands could be used to transfer your HDFS data:

``` bash
# check data structure
hdfs dfs -ls hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/

hdfs dfs -copyToLocal hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/ <local-folder>
```

`<hdfs-namenode-ip>` and `<hdfs-namenode-port>` is the ip of PAI master and `9000` if you did't modify the default setting. Please make sure your local folder has enough capacity to hold the data you want to save.

#### Metadata of Jobs and Users

Metadata of jobs and users will also be lost, including job records, job log, user name, user password, etc. We do not have an automatical tool for you to backup these data. Please transfer the data manually if you find some are valuable.

#### Other Resources on Kubernetes

If you have deployed any other resources on Kubernetes, please make a proper backup for them, because the Kubernetes cluster will be destroyed, too.

### Remove Previous PAI deployment

To remove the previous deployment, please use the commands below:

``` bash
git clone https://github.com/Microsoft/pai.git
cd pai
#  checkout to a different branch if you have a different version
git checkout pai-0.14.y

# delete all pai service and remove all service data
./paictl.py service delete

# delete k8s cluster
./paictl.py cluster k8s-clean -f -p <path-to-your-old-config>
```

If you cannot find the old config, the following command can help you to retrieve it:

``` bash
./paictl.py config pull -o <path-to-your-old-config>
```

You should also remove the GPU driver installed by OpenPAI, by executing the following commands on every GPU node, using a `root` user:

``` bash
#!/bin/bash

lsmod | grep -qE "^nvidia" &&
{
    DEP_MODS=`lsmod | tr -s " " | grep -E "^nvidia" | cut -f 4 -d " "`
    for mod in ${DEP_MODS//,/ }
    do
        rmmod $mod ||
        {
            echo "The driver $mod is still in use, can't unload it."
            exit 1
        }
    done
    rmmod nvidia ||
    {
        echo "The driver nvidia is still in use, can't unload it."
        exit 1
    }
}

rm -rf /var/drivers
reboot
```

After the removal, you can now install OpenPAI >= `v1.0.0` by following [Installation From Scratch](#installation-from-scratch).

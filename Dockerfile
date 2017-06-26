# base image
FROM ubuntu:16.04
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update

# --- locale ---
RUN apt-get install locales
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# --- libpostal ---

# dependencies
RUN apt-get install -y curl libsnappy-dev autoconf automake libtool pkg-config git time

# clone
RUN mkdir -p /usr/src/repos
WORKDIR /usr/src/repos
RUN git clone https://github.com/openvenues/libpostal

# build libpostal
WORKDIR /usr/src/repos/libpostal
RUN ./bootstrap.sh
RUN mkdir -p /opt/libpostal_data
RUN ./configure --datadir=/opt/libpostal_data
RUN make
RUN make install
RUN ldconfig

# --- nodejs ---

# clone
RUN mkdir -p /usr/src/repos
WORKDIR /usr/src/repos
RUN git clone https://github.com/isaacs/nave.git

# install
WORKDIR /usr/src/repos/nave
RUN ./nave.sh usemain 4.4.7

# --- node app ---

# dependencies
RUN apt-get update && apt-get install -y python sqlite3 gdal-bin

# create app directory
RUN mkdir -p /usr/src/repos/interpolation
WORKDIR /usr/src/repos/interpolation

# copy source code
COPY . /usr/src/repos/interpolation

# Install app dependencies
RUN npm install

# run tests
RUN npm test

# expose server port
ENV PORT=3000
EXPOSE 3000

# attach data directory
VOLUME "/data"

# set entry point
WORKDIR /usr/src/repos/interpolation
ENTRYPOINT [ "./interpolate" ];
CMD [ "server", "/data/address.db", "/data/street.db" ]

# base image
FROM pelias/libpostal_baseimage

# dependencies
RUN apt-get update && \
    apt-get install -y python sqlite3 gdal-bin lftp unzip pigz time && \
    rm -rf /var/lib/apt/lists/*

# --- pbf2json ---

# location where the db files will be created
ENV BUILDDIR '/data/interpolation'

# location of the openstreetmap data
ENV OSMPATH '/data/openstreetmap'

# location of the polylines data
ENV POLYLINEPATH '/data/polylines'

# location of the openaddresses data
ENV OAPATH '/data/openaddresses'

# location of TIGER data
ENV TIGERPATH '/data/tiger/'

ENV WORKINGDIR '/'

# clone app
RUN git clone https://github.com/pelias/interpolation.git /code/pelias/interpolation

# change working dir
WORKDIR /code/pelias/interpolation

# consume the build variables
ARG REVISION=production

# switch to desired revision
RUN git checkout $REVISION

# Install app dependencies
RUN npm install

# run tests
RUN npm test

# create script for building
RUN echo 'export PBF2JSON_FILE=$(ls ${OSMPATH}/*.osm.pbf | head -n 1); export POLYLINE_FILE=$(ls ${POLYLINEPATH}/*.0sv | head -n 1); npm run build' > ./docker_build.sh;


CMD [ "./interpolate", "server", "/data/interpolation/address.db", "/data/interpolation/street.db" ]

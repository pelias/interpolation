# base image
FROM pelias/baseimage

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

# change working dir
ENV WORKDIR /code/pelias/interpolation
WORKDIR ${WORKDIR}

# Install app dependencies first
ADD package.json ${WORKDIR}
RUN npm install

ADD . ${WORKDIR}

# run tests
RUN npm test

# entrypoint
CMD [ "./interpolate", "server", "/data/interpolation/address.db", "/data/interpolation/street.db" ]

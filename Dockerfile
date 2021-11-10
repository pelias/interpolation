# builder image for node-postal (requires c++ toolchain and python3)
FROM pelias/libpostal_baseimage as builder

ENV WORKDIR /code/pelias/interpolation
WORKDIR ${WORKDIR}

# install dependencies for node-postal build
RUN apt-get update && apt-get install -y python3 build-essential

COPY --chown=pelias ./package.json ${WORKDIR}

RUN npm install

# base image
FROM pelias/libpostal_baseimage

# interpolation dependencies
RUN apt-get update && \
    apt-get install -y sqlite3 gdal-bin lftp unzip pigz time gawk && \
    rm -rf /var/lib/apt/lists/*

# change working dir
ENV WORKDIR /code/pelias/interpolation
WORKDIR ${WORKDIR}

RUN chown -R pelias /code

# de-escalate to non-root user
USER pelias

# copy npm dependencies from builder image
COPY --chown=pelias --from=builder $WORKDIR/node_modules node_modules/

# add the code
COPY --chown=pelias . ${WORKDIR}

# run a quick test that libpostal and node-postal are fully working
RUN node test/test_libpostal.js

# run tests
RUN npm test && npm run funcs && rm -rf test

# location where the db files will be created
ENV BUILDDIR '/data/interpolation'

# location of the openstreetmap data
ENV OSMPATH '/data/openstreetmap'

# location of the polylines data
ENV POLYLINEPATH '/data/polylines'

# location of the openaddresses data
ENV OAPATH '/data/openaddresses'

# location of TIGER data
ENV TIGERPATH '/data/tiger'

# root location of data files
ENV WORKINGDIR '/data'

# entrypoint
CMD [ "./interpolate", "server", "/data/interpolation/address.db", "/data/interpolation/street.db" ]

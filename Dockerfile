# base image
FROM pelias/baseimage

# dependencies
RUN apt-get update && \
    apt-get install -y python sqlite3 gdal-bin lftp unzip pigz time gawk && \
    rm -rf /var/lib/apt/lists/*

# change working dir
ENV WORKDIR /code/pelias/interpolation
WORKDIR ${WORKDIR}

# de-escalate to non-root user
RUN chown -R pelias /code
USER pelias

# copy package.json first to prevent npm install being rerun when only code changes
COPY --chown=pelias ./package.json ${WORKDIR}

# install npm dependencies
RUN npm install

# add the rest of the code
COPY --chown=pelias . ${WORKDIR}

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
ENV TIGERPATH '/data/tiger/'

# root location of data files
ENV WORKINGDIR '/data'

# entrypoint
CMD [ "./interpolate", "server", "/data/interpolation/address.db", "/data/interpolation/street.db" ]

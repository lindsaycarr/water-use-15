# might be different for national? but should share a lot of code
get_state_dots <- function(json_file, data_file, proj.string="+proj=longlat +datum=WGS84", state_abrv){
  
  centroids <- read_json(json_file)$objects$centroids$geometries
  centroid_meta <- read_tsv(data_file)
  
  NA_out <- rep(NA, length(centroids))
  
  pt_coords <- matrix(data = c(NA_out, NA_out), ncol = 2)
  
  dot_data <- data.frame(total = NA_out, thermoelectric = NA_out, 
                         publicsupply = NA_out, irrigation = NA_out, industrial = NA_out)
  
  
  for (j in seq_len(length(centroids))){
    this_dot <- centroids[[j]]
    coord <- this_dot$coordinates
    state_abb <- this_dot$properties$STATE_ABBV
    # if (state_abrv %in% c(state_abb, "US")){
      pt_coords[j, ] <- c(coord[[1]][1], coord[[2]][1])
    # }
    
    this_meta <- filter(centroid_meta, GEOID == this_dot$properties$GEOID)[names(dot_data)]
    dot_data[j, ] <- this_meta
  }
  
  dot_data$STATE_ABBV <- sapply(centroids, function(x) x$properties$STATE_ABBV) # for national this is necessary
  
  points <- pt_coords[!is.na(pt_coords[, 1]), ] %>% 
    sp::SpatialPoints(proj4string = CRS("+proj=longlat +datum=WGS84")) %>% 
    sp::spTransform(CRS(proj.string)) %>% 
    sp::SpatialPointsDataFrame(data = dot_data[!is.na(pt_coords[, 1]), ])
  
  return(points)
}


get_us_totals <- function(json_file){

  us_totals <- read_json(json_file)
  totals_out <- data.frame(total = NA_character_, thermoelectric = NA_character_, 
                           publicsupply = NA_character_, irrigation = NA_character_, industrial = NA_character_,
                           other = NA_character_, state_abrv = 'US', state_name = "U.S.")
  
  for (i in 1:length(us_totals)){
    cat <- us_totals[[i]]$category
    char_num <- us_totals[[i]]$fancynums
    totals_out[[cat]] <- strsplit(char_num,'[.]')[[1]][1] # don't include decimal 
  }
  return(totals_out)
}
get_state_totals <- function(json_file, state_name, region_name = NULL, region_abbr = NULL){

  state_totals <- read_json(json_file)
  state_names <- sapply(state_totals, function(x) x$STATE_NAME)
  state_abbrvs <- sapply(state_totals, function(x) x$abrv)
  state_i <- which(state_names %in% state_name)
  
  if(state_i > 1) {
    state_name <- region_name
    state_abbrv <- region_abbr
  } else {
    state_name <- state_names[state_i]
    state_abbrv <- state_abbrvs[state_i]
  }
  
  if (length(state_i) == 0){
    stop('there is no match for state name ', state_name)
  }
  
  totals_out <- data.frame(total = NA_character_, thermoelectric = NA_character_, 
                           publicsupply = NA_character_, irrigation = NA_character_, industrial = NA_character_,
                           other = NA_character_, state_abrv = NA_character_, state_name = state_name)
  totals_numeric <- data.frame(total = NA_integer_, thermoelectric = NA_integer_, 
                               publicsupply = NA_integer_, irrigation = NA_integer_, industrial = NA_integer_)
  
  for (use_i in 1:ncol(totals_numeric)){
    cat_name <- names(totals_numeric)[use_i]
    total_num <- sum(sapply(state_i, function(x) state_totals[[x]]$use[[use_i]]$wateruse))
    totals_out[[cat_name]] <- format(total_num, digits = 4, nsmall = 0, big.mark = ",")
    totals_numeric[[cat_name]] <- total_num
  }
  other_num <- totals_numeric$total-rowSums(totals_numeric[!names(totals_numeric) %in% "total"])
  totals_out$other <- prettyNum(round(other_num, digits = 0), big.mark=",",scientific=FALSE)
  totals_out$state_abrv <- state_abbrv
  
  return(totals_out)
}

rank_states <- function(dots){
  county_data <- dots@data
  
  state_totals <- county_data %>% group_by(state) %>% 
    summarize(total = sum(total), irr = sum(irrigation), therm = sum(thermoelectric))
  return(state_totals)
}
fetchTimestamp.site_locations <- vizlab::alwaysCurrent

#' @title Fetch appropriate daily value sites from NWIS
#' 
#' @param viz a vizlab object that depends on the date
fetch.site_locations <- function(viz){
  library(dataRetrieval)
  library(dplyr)
  
  year <- 2017
  startDate <- paste0(year, "-01-01")
  endDate <- paste0(year, "-12-31")
  hucs <- zeroPad(1:21, 2)
  
  sites <- data.frame()
  for(huc in hucs){
    # figure out available sites
    sites_huc <- whatNWISdata(
      huc = huc, service = "dv", startDate = startDate,
      endDate = endDate, parameterCd = "00060", statCd = "00003") %>% 
      pull(site_no)
    
    # get site info
    sites_huc_info <- readNWISsite(sites_huc) %>% 
      select(site_no, station_nm, dec_lat_va, dec_long_va, state_cd, county_cd)
    
    # merge with other hucs
    sites <- bind_rows(sites, sites_huc_info)
  }
  
  saveRDS(sites, viz[['location']])
}